<script lang="ts">
import { defineComponent } from 'vue';

import { ClusterClassVariable } from '../../types/clusterClass.ts';
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
      type:    Array as unknown as Array<ClusterClassVariable>,
      default: () => {
        return [];
      }
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

  },

});
</script>

<template>
  <div>
    <template v-if="variableDefinitions && variableDefinitions.length">
      <Variable
        v-for="variableDef in variableDefinitions"
        :key="variableDef.name"
        class="mt-10"
        :variable="variableDef"
        :value="valueFor(variableDef)"
        @input="e=>updateVariables(e, variableDef)"
      />
    </template>
  </div>
</template>
