<script lang="ts">
import debounce from 'lodash/debounce';
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { randomStr } from '@shell/utils/string';
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
    // this key is used on the spacer element so it can be forced to re-calculate its visibility when the cluster class changes
    return { errorCount: 0, rerenderKey: randomStr() };
  },

  watch: {
    errorCount: {
      handler: debounce(function(neu) {
        this.$emit('validation-passed', !neu);
      }, 5),
    },
    variableDefinitions(neu, old) {
      this.updateVariableDefaults(neu, old);
      this.$nextTick(() => {
        this.rerenderKey = randomStr();
      });
    },
  },

  created() {
    this.updateVariableDefaults(this.variableDefinitions, []);
  },

  computed: {
    variableDefinitions() {
      return this.clusterClass?.spec?.variables || [];
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

    /**
   * When the cluster class changes, update the variables array:
   *  remove any variables not defined in the new cluster class
   *  if a variable is defined in both cluster classes, clear out the old default
   *  set default values from the new cluster class definitions
   *  if a variable is defined in both old and new cluster classes, and the user has set its value to something other than the old default, preserve that
   */
    updateVariableDefaults(neu: ClusterClassVariable[], old: ClusterClassVariable[]) {
      const out = [...this.value].reduce((acc: CapiClusterVariable[], existingVar: CapiClusterVariable) => {
        const neuDef = (neu || []).find(n => n.name === existingVar.name);

        if (!neuDef) {
          return acc;
        }
        const oldDefault = (old || []).find(d => d.name === existingVar.name)?.schema?.openAPIV3Schema?.default;

        if (oldDefault && existingVar.value === oldDefault) {
          delete existingVar.value;
        }
        const newDefault = neuDef.schema?.openAPIV3Schema?.default;

        if (newDefault && !existingVar.value) {
          existingVar.value = newDefault;
        }
        acc.push(existingVar);

        return acc;
      }, []);

      neu.forEach((def) => {
        const newDefault = def.schema?.openAPIV3Schema?.default;

        if (newDefault && !out.find(v => v.name === def.name)) {
          out.push({ name: def.name, value: newDefault });
        }
      });

      this.errorCount = 0;
      this.$emit('input', out);
    },

    updateErrors(isValid: boolean) {
      if (!isValid) {
        this.errorCount++;
      } else {
        this.errorCount--;
      }
    },

    newComponentType(variableDef: ClusterClassVariable, i: number) {
      const inputEl = this.$refs[`${ variableDef.name }-input`]?.[0]?.$el;
      const nextInputEl = this.$refs[`${ this.variableDefinitions[i + 1]?.name }-input`]?.[0]?.$el;

      if (!nextInputEl) {
        return false;
      }

      return inputEl?._prevClass !== nextInputEl._prevClass;
    }
  },

});
</script>

<template>
  <div class="variables">
    <template v-if="variableDefinitions && variableDefinitions.length">
      <template v-for="(variableDef, i) in variableDefinitions">
        <Variable
          :key="`${variableDef.name}`"
          :ref="`${variableDef.name}-input`"
          :variable="variableDef"
          :value="valueFor(variableDef)"
          @input="e=>updateVariables(e, variableDef)"
          @validation-passed="updateErrors"
        />
        <div v-if="newComponentType(variableDef, i)" :key="`${i}-${rerenderKey}`" class="force-newline" />
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
$standard-input: 23.25%;
$wider-input: 48.25%;

.variables {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  &>*{
    flex: 0 1 $standard-input;
    margin: 0 1.75% 10px 0;
    max-width: $standard-input;
    &::v-deep.wider{
      flex: 0 1 $wider-input;
      max-width: $wider-input;
    }

  }
  &>.force-newline {
    flex: 1 0 100%;
    max-width: initial;
  }
}
</style>
