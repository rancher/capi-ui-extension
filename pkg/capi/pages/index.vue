<script>
import { CAPI as RANCHER_CAPI, SCHEMA } from '@shell/config/types';
import Banner from '@components/Banner/Banner.vue';
import { CAPI } from '../types/capi.ts';
import InstallHelmCharts from '@shell/components/InstallHelmCharts.vue';
import { Checkbox } from '@rancher/components';

export default {
  name: 'CAPITurtlesDashboard',

  async beforeCreate() {
    try {
      // // TODO nb turn back on
      // const turtlesProviderSchema = await this.$store.dispatch('management/find', {
      //   type: SCHEMA,
      //   id:   CAPI.PROVIDER,
      //   opt:  { force: true },
      // });

      // if (turtlesProviderSchema) {
      // this.$router.replace({
      //   name:   'c-cluster-product-resource',
      //   params: {
      //     ...this.$router.currentRoute.params,
      //     cluster:  '_',
      //     resource: RANCHER_CAPI.CAPI_CLUSTER,
      //     product:  'manager'
      //   }
      // });
      // }
    } catch {}
  },

  data() {
    return { willInstall: false };
  },

  components: {
    Banner,
    InstallHelmCharts,
    Checkbox
  },

  computed: {
    hasClusterClassSchema() {
      // TODO nb undo
      // return !!this.$store.getters['management/schemaFor'](CAPI.CLUSTER_CLASS);
      return false;
    },
  }

};
</script>

<template>
  <div>
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

      <Banner color="info">
        <div class="row">
          <t
            v-if="!hasClusterClassSchema"
            k="capi.installation.turtlesNeeded"
            raw
          />
        </div>
      </Banner>
      <div class="row">
        <InstallHelmCharts
          :repo-display-name="t('capi.installation.title')"
          :chart-display-name="t('capi.installation.title')"
          store="management"
          chart-name="rancher-turtles"
          repo-name="turtles"
          repo-url="https://rancher.github.io/turtles"
          :extra-values="{rancherTurtles: {features:{default: false}}}"
        >
          <template #values="{setValue, values}">
            <Checkbox
              class="mb-10"
              :label="t('capi.installation.includeCertManager')"
              :value="values?.['cluster-api-operator']?.['cert-manager']?.enabled"
              @update:value="e=>setValue(`'cluster-api-operator'.'cert-manager'.enabled`, e)"
            />
          </template>
        </InstallHelmCharts>
      </div>
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

  .banner {
    width: auto;
    display: flex;
    flex-direction: column;
  }
}
</style>
