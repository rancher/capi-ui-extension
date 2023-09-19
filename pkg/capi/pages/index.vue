<script>
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

import Banner from '@components/Banner/Banner.vue';

export default {
  name: 'CAPITurtlesDashboard',

  components: { Banner },

  async fetch() {
    const hash = {
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

      return embeddedCapiFeature?.spec?.value;
    },

    hasCapiOperator() {
      return !!this.installedApps.find(app => app.id === 'capi-operator/cluster-api-operator');
    },

    hasTurtlesOperator() {
      return !!this.installedApps.find(app => app.id === 'turtles/rancher-turtles');
    }
  }

};
</script>

<template>
  <div>
    <div v-if="embeddedCapiEnabled || !hasTurtlesOperator || !hasCapiOperator" class="not-installed">
      <h1 class="mb-20">
        {{ t("capi.installation.title") }}
      </h1>
      <p
        class="description"
        v-html="t('capi.installation.description', {}, true)"
      />
      <Banner color="warning">
        <div>
          <t v-if="embeddedCapiEnabled" k="capi.installation.disableFeatureFlag" raw /><br />
          <t v-if="!hasTurtlesOperator" k="capi.installation.turtlesNeeded" raw />
        </div>
      </Banner>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-installed {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin: 100px 0;

  .description {
    line-height: 20px;
  }
}
</style>
