<script>
import { MANAGEMENT, CAPI as RANCHER_CAPI, SCHEMA } from '@shell/config/types';
import Banner from '@components/Banner/Banner.vue';
import { CAPI } from '../types/capi.ts';

export default {
  name: 'CAPITurtlesDashboard',

  async middleware({ redirect, route, store } ) {
    try {
      const clusterClassSchema = await store.dispatch('management/find', {
        type: SCHEMA,
        id:   CAPI.CLUSTER_CLASS,
        opt:  { force: true },
      });

      if (clusterClassSchema) {
        return redirect({
          name:   'c-cluster-product-resource',
          params: {
            ...route.params,
            cluster:  '_',
            resource: RANCHER_CAPI.CAPI_CLUSTER,
            product:  'manager'
          }
        });
      }
    } catch {}
  },

  components: { Banner },

  async fetch() {
    if (this.$store.getters['management/canList'](MANAGEMENT.FEATURE)) {
      this.features = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.FEATURE });
    }
  },
  data() {
    return { features: [] };
  },

  computed: {
    // if the flag is undefined that is equivalent to this feature being enabled
    embeddedCapiEnabled() {
      const embeddedCapiFeature = this.features.find(f => f.id === 'embedded-cluster-api');

      return embeddedCapiFeature?.spec?.value || !embeddedCapiFeature;
    },

    hasClusterClassSchema() {
      return !!this.$store.getters['management/schemaFor'](CAPI.CLUSTER_CLASS);
    },
  }

};
</script>

<template>
  <div>
    <div v-if="embeddedCapiEnabled || !hasClusterClassSchema" class="centered">
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
          <t v-if="!hasClusterClassSchema" k="capi.installation.turtlesNeeded" raw />
        </div>
      </Banner>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.centered {
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
