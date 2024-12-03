<script>
import { MANAGEMENT } from '@shell/config/types';
import Banner from '@components/Banner/Banner.vue';
import { CAPI } from '../types/capi.ts';

export default {
  name: 'ClusterListCAPIWarning',

  components: { Banner },

  async fetch() {
    if (this.$store.getters['management/schemaFor'](MANAGEMENT.FEATURE)) {
      await this.$store.dispatch('management/findAll', { type: MANAGEMENT.FEATURE });
    }
  },

  computed: {
    capiFeatureDisabled() {
      const capiFeature = this.$store.getters['management/byId'](MANAGEMENT.FEATURE, 'embedded-cluster-api');

      return (capiFeature && !capiFeature?.spec?.value);
    },

    hasClusterClassSchema() {
      return !!this.$store.getters['management/schemaFor'](CAPI.CLUSTER_CLASS);
    },
    showWarning() {
      return this.capiFeatureDisabled && !this.hasClusterClassSchema;
    }
  }
};
</script>

<template>
  <Banner
    v-if="showWarning"
    color="warning"
    label-key="capi.warnings.embeddedFeatureFlag"
  />
</template>
