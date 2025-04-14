<script>
import { CAPI as RANCHER_CAPI, SCHEMA } from '@shell/config/types';
import Banner from '@components/Banner/Banner.vue';
import { CAPI } from '../types/capi.ts';
import InstallChart from '../components/InstallChart/index.vue';

export default {
  name: 'CAPITurtlesDashboard',

  async beforeCreate() {
    try {
      const turtlesProviderSchema = await this.$store.dispatch('management/find', {
        type: SCHEMA,
        id:   CAPI.PROVIDER,
        opt:  { force: true },
      });

      if (turtlesProviderSchema) {
        this.$router.replace({
          name:   'c-cluster-product-resource',
          params: {
            ...this.$router.currentRoute.params,
            cluster:  '_',
            resource: RANCHER_CAPI.CAPI_CLUSTER,
            product:  'manager'
          }
        });
      }
    } catch {}
  },

  data() {
    return { willInstall: false };
  },

  components: { Banner, InstallChart },

  computed: {
    hasClusterClassSchema() {
      return !!this.$store.getters['management/schemaFor'](CAPI.CLUSTER_CLASS);
    },
  }

};
</script>

<template>
  <div v-if="!willInstall">
    <div
      v-if="!hasClusterClassSchema"
      class="centered"
    >
      <h1 class="mb-20">
        {{ t("capi.installation.title") }}
      </h1>
      <p
        class="description"
        v-html="t('capi.installation.description', {}, true)"
      />
      <Banner color="warning">
        <div>
          <t
            v-if="!hasClusterClassSchema"
            k="capi.installation.turtlesNeeded"
            raw
          />
        </div>
      </Banner>
    </div>
    <div>
      <button
        type="button"
        class="btn role-primary"
        @click="()=>willInstall=true"
      >
        install turts
      </button>
    </div>
  </div>
  <div v-else>
    <InstallChart
      chart-name="rancher-turtles"
      repo-name="turtles"
      repo-url="https://rancher.github.io/turtles"
    />
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

  .banner {
    width: auto;
  }
}
</style>
