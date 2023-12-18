<script lang="ts">
import { defineComponent } from 'vue';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { CAPI } from '../types/capi';
import CCVariables from '../components/CCVariables';

const TEST_CC_ID = 'default/quickstart-more-variables';

export default defineComponent({
  name: 'EditCapiCluster',

  components: {
    CCVariables, Tabbed, Tab
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    this.$set(this.value, 'spec', { topology: { variables: [] } });
    this.clusterClass = await this.$store.dispatch('management/find', { type: CAPI.CLUSTER_CLASS, id: TEST_CC_ID });
  },

  data() {
    return { clusterClass: null, variables: [] };
  },

  // computed: {
  //   variables: {
  //     get() {
  //       return this.value?.spec?.topology?.variables || [];
  //     },
  //     set(neu) {
  //       this.$set(this.value, 'spec.topology.variables', neu);
  //     }
  //   }
  // },

});
</script>

<template>
  <div>
    <Tabbed :side-tabs="true">
      <Tab name="variables">
        <CCVariables v-if="clusterClass" v-model="variables" :cluster-class="clusterClass" />
      </tab>
    </Tabbed>
  </div>
</template>
