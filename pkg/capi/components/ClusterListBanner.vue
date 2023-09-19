<script>
import { MANAGEMENT } from '@shell/config/types';
import Banner from '@components/Banner/Banner.vue';

export default {
  name: 'ClusterListCAPIWarning',

  components: { Banner },

  async fetch() {
    if (this.$store.getters['management/schemaFor'](MANAGEMENT.FEATURE)) {
      await this.$store.dispatch('management/findAll', { type: MANAGEMENT.FEATURE });
    }
  },

  computed: {
    showWarning() {
      const capiFeature = this.$store.getters['management/byId'](MANAGEMENT.FEATURE, 'embedded-cluster-api');

      return (capiFeature && !capiFeature?.spec?.value);
    }
  }
};
</script>

<template><Banner v-if="showWarning" color="warning" label-key="capi.warnings.embeddedFeatureFlag" /></template>
