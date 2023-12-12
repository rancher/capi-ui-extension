<script lang="ts">
import Vue from 'vue';
import CCVariables from '../components/CCVariables';

// TODO remove
import data from '../components/CCVariables/data.ts';

export default Vue.extend({
  name: 'BlergPlaceholder',

  components: { CCVariables },
  data() {
    return {
      clusterClass: {
        name: 'test-cc-data',
        spec: { variables: data }
      },

      value: { spec: { topology: { variables: [] } } }
    };
  }
});
</script>

<template>
  <CCVariables v-model="value.spec.topology.variables" :cluster-class="clusterClass" />
</template>
