<script>
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import Vue, { defineComponent } from 'vue';

import Banner from '@components/Banner/Banner.vue';

export default {
  name: 'CAPITurtlesDashboard',

  components: { Banner },

  async fetch() {
    const hash = {
    // todo what if no permission to view installed apps?
    // need to be connected to local cluster...
      installedApps: this.$store.dispatch('cluster/findAll', { type: CATALOG.APP }),
      features:      this.$store.dispatch('management/findAll', { type: MANAGEMENT.FEATURE }),
    };

    try {
      const res = await allHash(hash);

      this.installedApps = res.installedApps;
      this.features = res.features;
    } catch (err) {
      console.error(err);
    }
  },
  data() {
    return { installedApps: [], features: [] };
  },

  computed: {
    embeddedCapiEnabled() {
      const embeddedCapiFeature = this.features.find(f => f.id === 'embedded-cluster-api');

      return !!embeddedCapiFeature?.spec?.value;
    },

    hasCapiOperator() {
      return !!this.installedApps.find(app => app.id === 'capi-operator/cluster-api-operator');
    },

    hasTurtlesOperator() {
      return !!this.installedApps.find(app => app.id === 'turtles/rancher-turtles');
    },
  }

};
</script>

<template>
  <div>
    <Banner v-if="!embeddedCapiEnabled" label-key="capi.installation.disableFeatureFlag" color="error" />
  </div>
</template>
