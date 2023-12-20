<script lang="ts">
import { defineComponent } from 'vue';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { CAPI } from '../types/capi';
import CCVariables from '../components/CCVariables';
const TEST_CC_ID = 'default/quickstart-more-variables';

export default defineComponent({
  name:       'EditCapiCluster',
  components: {
    CCVariables, Tabbed, Tab, LabeledSelect
  },
  props: {

    value: {
      type:    Object,
      default: null,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'capi-provider-create'
    }
  },
  async fetch() {
    this.$set(this.value, 'spec', { topology: { variables: [] } });
    this.clusterClasses = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });
  },
  data() {
    return {
      clusterClassId: null, clusterClasses: [], variables: [], variablesValid: true
    };
  },

  computed: {

    clusterClassOptions() {
      return (this.clusterClasses || []).map((cc: any) => {
        return { label: cc.metadata.name, value: cc.id };
      });
    },
    clusterClass() {
      return this.clusterClassId && this.clusterClasses ? this.clusterClasses.find(cc => cc.id === this.clusterClassId) : null;
    }
  }
});
</script>

<template>
  <div>
    <div>Is valid: {{ variablesValid }}</div>
    <LabeledSelect v-if="clusterClasses" v-model="clusterClassId" :options="clusterClassOptions" />
    <Tabbed :side-tabs="true">
      <Tab name="variables">
        <CCVariables v-if="clusterClass" v-model="variables" :cluster-class="clusterClass" @validation-passed="e=>variablesValid=e" />
      </tab>
    </Tabbed>
  </div>
</template>
