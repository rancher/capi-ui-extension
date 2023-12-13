<script lang="ts">
import debounce from 'lodash/debounce';
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { ClusterClassVariable } from '../../types/clusterClass';
import type { CapiClusterVariable } from '../../types/cluster.x-k8s.io.cluster';
import Variable from './Variable.vue';

export default defineComponent({
  name: 'ClusterClassVariables',

  components: { Variable },

  props: {
    clusterClass: {
      type:    Object,
      default: () => {}
    },

    // <cluster.x-k8s.io>.spec.topology.variables
    value: {
      type:    Array as PropType<Array<CapiClusterVariable>>,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return { errorMap: {} as {[key:string]: boolean} };
  },

  watch: {
    hasValidationErrors: {
      handler: debounce(function(neu) {
        this.$emit('validation-passed', !neu);
      }, 5),
    }
  },

  created() {
    const out = [...this.value];

    this.variableDefinitions.forEach((def: ClusterClassVariable) => {
      const defaultValue = def.schema.openAPIV3Schema.default;

      if (!out.find((variable: any) => {
        return variable.name === def.name;
      }) && defaultValue) {
        out.push({ name: def.name, value: defaultValue });
      }
    });

    this.$emit('input', out);
  },

  computed: {
    variableDefinitions() {
      return this.clusterClass?.spec?.variables || [];
    },

    hasValidationErrors() {
      return !!Object.keys(this.errorMap).length;
    },
  },

  methods: {
    valueFor(variableDef: ClusterClassVariable) {
      return (this.value.find((variable: any) => variable.name === variableDef.name) || {}).value;
    },

    updateVariables(val: any, variableDef: ClusterClassVariable) {
      const out = [...this.value] as Array<any>;
      const existingIdx = this.value.findIndex((variable: any) => variable.name === variableDef.name);

      if (existingIdx >= 0) {
        out[existingIdx].value = val;
      } else {
        out.push({ value: val, name: variableDef.name });
      }
      this.$emit('input', out);
    },

    updateErrors(isValid: boolean, variableDef: ClusterClassVariable) {
      if (isValid && this.errorMap[variableDef.name]) {
        this.$delete(this.errorMap, variableDef.name);
      } else if (!isValid && !this.errorMap[variableDef.name]) {
        this.$set(this.errorMap, variableDef.name, true);
      }
    },

  },

});
</script>

<template>
  <div class="variables">
    <template v-if="variableDefinitions && variableDefinitions.length">
      <Variable
        v-for="variableDef in variableDefinitions"
        :key="variableDef.name"
        :variable="variableDef"
        :value="valueFor(variableDef)"
        @input="e=>updateVariables(e, variableDef)"
        @validation-passed="e=>updateErrors(e, variableDef)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.variables {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  &>*{
    flex: 1 0 20%;
    margin: 0 1.75% 10px 0;
    max-width: 23.25%;
    align-self: center;
  }
}
</style>
