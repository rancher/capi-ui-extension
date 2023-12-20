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
    return { errorCount: 0 };
  },

  watch: {
    errorCount: {
      handler: debounce(function(neu) {
        this.$emit('validation-passed', !neu);
      }, 5),
    },
    variableDefinitions(neu, old) {
      this.updateVariableDefaults(neu, old);
    },
  },

  created() {
    this.updateVariableDefaults(this.variableDefinitions, []);
  },

  computed: {
    variableDefinitions() {
      return this.clusterClass?.spec?.variables || [];
    }
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

    newComponentType(variableDef: ClusterClassVariable, idx: number) {
      console.log('calculating new component type');
      const ref = `${ variableDef.name }-input`;
      const nextDef = this.variableDefinitions[idx + 1];

      if (!nextDef) {
        return false;
      }
      const nextRef = `${ nextDef.name }-input`;

      const nextComponent = this.$refs?.[nextRef]?.[0]?.componentForType;
      const currentComponent = this.$refs?.[ref]?.[0]?.componentForType;

      return nextComponent && currentComponent && (nextComponent?.name !== currentComponent?.name);
    },
  },

});
</script>

<template>
  <div :key="`${clusterClass.id}`" class="variables">
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
        <div v-if="newComponentType(variableDef, i)" :key="`${variableDef.name}-${clusterClass.id}-break`" class="row-break" />
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.variables {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  &>*{
    flex: 0 0 23.25%;
    margin: 0 1.75% 10px 0;
    max-width: 23.25%;
    &::v-deep.wider{
      flex: 0 0 48.25%;
      max-width: 48.25%;
    }
    &.row-break {
      flex: 1 0 100%;
      max-width: 100%;
      margin: 10px 0px 0px 0px;
    }
  }
}
</style>
