<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import ResourceFetch from '@shell/mixins/resource-fetch';

import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import Markdown from '@shell/components/Markdown';
import semver from 'semver';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';

import Wizard from './Wizard';

// import { KUBEWARDEN_CHARTS, KUBEWARDEN_REPOS } from '@kubewarden/types';
// import { getLatestVersion } from '@kubewarden/plugins/kubewarden-class';
// import { handleGrowl } from '@kubewarden/utils/handle-growl';
// import { refreshCharts } from '@kubewarden/utils/chart';

// TODO nb not this? Put this in a util?
export function getLatestVersion(store, versions) {
  const showPreRelease = store.getters['prefs/get'](SHOW_PRE_RELEASE);

  const versionMap = versions?.map((v) => v.version)
    .filter((v) => showPreRelease ? v : !semver.prerelease(v));

  return semver.rsort(versionMap)[0];
}

export default {
  props: {
    hasSchema: {
      type:     Object,
      default:  null
    },

    chartName: {
      type:     String,
      required: true
    },

    repoName: {
      type:     String,
      required: true

    },

    repoUrl: {
      type:     String,
      required: true

    },

  },

  components: {
    AsyncButton,
    Banner,
    Wizard,
    Loading,
    Markdown
  },

  mixins: [ResourceFetch],

  async fetch() {
    await this.$store.dispatch('catalog/load');
    this.debouncedRefreshCharts = debounce((init = false) => {
      try {
        //   refreshCharts({
        //     store:     this.$store,
        //     chartName: this.chartName,
        //     init
        //   });
        this.$store.dispatch('catalog/load', { force: true });
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
      }
    }, 500);

    this.reloadReady = false;

    // if (!this.hasSchema) {
    // if (this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO)) {
    //   await this.$fetchType(CATALOG.CLUSTER_REPO);
    // }

    if (this.controllerChart) {
      this.initStepIndex = 1;
      this.installSteps[0].ready = true;
    }

    if (!this.targetRepo || !this.controllerChart) {
      this.debouncedRefreshCharts(true);
    }
    // }
  },

  data() {
    // TODO nb localize
    const installSteps = [
      {
        name:  'repository',
        label: 'Repository',
        ready: false,
      },
      {
        name:  'install',
        label: 'App Install',
        ready: false,
      },
    ];

    return {
      installSteps,
      debouncedRefreshCharts: null,
      reloadReady:            false,
      // TODO nb what does this step do??
      install:                true,
      initStepIndex:          0,
      docs:                   { airgap: '' },
    };
  },

  //   async mounted() {
  //     if (this.isAirgap) {
  //       const docs = (await import(/* webpackChunkName: "airgap-docs" */ '../../assets/airgap-installation.md'));

  //       if (docs) {
  //         this.docs.airgap = docs.body;
  //       }
  //     }
  //   },

  watch: {
    controllerChart() {
      this.installSteps[0].ready = true;

      if (this.isAirgap) {
        this.debouncedRefreshCharts();
      }

      this.$refs.wizard?.goToStep(2);
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts',
      repos:  'catalog/repos',
      t:      'i18n/t'
    }),

    // isAirgap() {
    //   return this.$store.getters['kubewarden/airGapped'];
    // },

    /**
       * [!IMPORTANT]
       * TODO:
       * THIS IS BROKEN
       * When installing, if you add the repo and leave the page
       * then come back, the controllerChart will be null, but so will
       * the targetRepo. This is because the repo is not saved to the store?
       */
    controllerChart() {
      if (this.targetRepo) {
        // return this.$store.getters['catalog/chart']({
        //   repoName:  this.repoName,
        //   repoType:  'cluster',
        //   chartName: this.chartName
        // });
        // TODO nb why search b y chartName not working?
        return this.charts.find((chart) => chart.repoName === this.repoName && chart.repoType === 'cluster');
      }

      return null;
    },

    targetRepo() {
      this.charts.forEach((chart) => console.dir(chart));
      //   const chart = this.charts?.find((chart) => chart.chartName === this.chartName);
      // TODO nb why doesn't chart name work
      const chart = this.charts?.find((chart) => chart.repoName === this.repoName);

      return this.repos?.find((repo) => repo.id === chart?.repoName);
    },

    shellEnabled() {
      return !!this.currentCluster?.links?.shell;
    }
  },

  methods: {
    async addRepository(btnCb) {
      try {
        // TODO nb probably can't use management here
        const repoObj = await this.$store.dispatch('management/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: this.repoName },
          spec:     { url: this.repoUrl },
        });

        try {
          await repoObj.save();
        } catch (e) {
          //   handleGrowl({
          //     error: e,
          //     store: this.$store
          //   });

          this.$store.dispatch('growl/fromError', { err: e });
          btnCb(false);

          return;
        }

        if (!this.controllerChart) {
          this.debouncedRefreshCharts();
          btnCb(true);
        }
      } catch (e) {
        // handleGrowl({
        //   error: e,
        //   store: this.$store
        // });
        this.$store.dispatch('growl/fromError', { err: e });

        btnCb(false);
      }
    },

    chartRoute() {
      if (!this.controllerChart) {
        try {
          this.debouncedRefreshCharts();
        } catch (e) {
          //   handleGrowl({
          //     error: e,
          //     store: this.$store
          //   });
          this.$store.dispatch('growl/fromError', { err: e });

          return;
        }
      }

      this.controllerChart.goToInstall(null, this.currentCluster?.id || 'local');
      // // TODO nb use chart model goToInstall
      // const {
      //   repoType, repoName, chartName, versions
      // } = this.controllerChart;

      // const latestChartVersion = getLatestVersion(this.$store, versions);

      // if (latestChartVersion) {
      //   const query = {
      //     [REPO_TYPE]: repoType,
      //     [REPO]:      repoName,
      //     [CHART]:     chartName,
      //     [VERSION]:   latestChartVersion
      //   };

      //   // TODO nb hardcode local?
      //   // pass as prop?
      //   // TODO nb one-button install with default configuration?
      //   this.$router.push({
      //     name:   'c-cluster-apps-charts-install',
      //     params: { cluster: 'local' },
      //     query,
      //   });
      // } else {
      //   const error = {
      //     _statusText: this.t('kubewarden.dashboard.appInstall.versionError.title'),
      //     message:     this.t('kubewarden.dashboard.appInstall.versionError.message')
      //   };

      //   // handleGrowl({
      //   //   error,
      //   //   store: this.$store
      //   // });
      //   this.$store.dispatch('growl/fromError', { err: error });
      // }
    },

    reload() {
      this.$router.go();
    },

    quickInstall() {
      // TODO nb install chart with default configuration
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div
    v-else
    class="container"
  >
    <div
      v-if="!install"
      class="title p-10"
    >
      <!-- <div class="logo mt-20 mb-10">
        icon go here
      </div>
      <h1
        class="mb-20"
        data-testid="kw-install-title"
      >
        {{ chartName }}
      </h1>
      <div class="description">
        chart description go here
      </div>
      <button
        v-if="!hasSchema"
        class="btn role-primary mt-20"
        data-testid="kw-initial-install-button"
        @click="install = true"
      >
        install chart
      </button> -->
    </div>

    <template v-else>
      <!-- Air-Gapped -->
      <template v-if="isAirgap">
        <Banner
          class="mb-20 mt-20"
          color="warning"
        >
          <span data-testid="kw-install-ag-warning">{{ t('kubewarden.dashboard.prerequisites.airGapped.warning') }}</span>
        </Banner>
        <Markdown v-model:value="docs.airgap" />
      </template>

      <!-- Non Air-Gapped -->
      <!-- <template v-else> -->
      <Wizard
        ref="wizard"
        :init-step-index="initStepIndex"
        :steps="installSteps"
        data-testid="kw-install-wizard"
      >
        <template #repository>
          <h2
            class="mt-20 mb-10"
            data-testid="kw-repo-title"
          >
            {{ t("kubewarden.dashboard.prerequisites.repository.title") }}
          </h2>
          <p class="mb-20">
            {{ t("kubewarden.dashboard.prerequisites.repository.description") }}
          </p>
          <!-- TODO nb asyncButton mode in shell en-us -->
          <AsyncButton
            mode="install"
            @click="addRepository"
          />
        </template>

        <template #install>
          <h2
            class="mt-20 mb-10"
            data-testid="kw-app-install-title"
          >
            {{ t("kubewarden.dashboard.appInstall.title") }}
          </h2>
          <p class="mb-20">
            {{ t("kubewarden.dashboard.appInstall.description") }}
          </p>

          <div class="chart-route">
            <Loading
              v-if="!controllerChart && !reloadReady"
              mode="relative"
              class="mt-20"
            />

            <template v-else-if="!controllerChart && reloadReady">
              <Banner color="warning">
                <span class="mb-20">
                  {{ t('kubewarden.dashboard.appInstall.reload' ) }}
                </span>
                <button
                  data-testid="kw-app-install-reload"
                  class="ml-10 btn btn-sm role-primary"
                  @click="reload()"
                >
                  {{ t('generic.reload') }}
                </button>
              </Banner>
            </template>

            <template v-else>
              <div class="row mt-10">
                <button
                  type="button"
                  class="btn role-primary mr-10"
                  @click="quickInstall"
                >
                  quick install
                </button>
                <button
                  type="button"
                  class="btn role-primary"
                  :disabled="!controllerChart"
                  @click.prevent="chartRoute"
                >
                  go to chart install
                </button>
              </div>
            </template>
          </div>
        </template>
      </Wizard>
      <!-- </template> -->
    </template>
  </div>
</template>

<style lang="scss" scoped>
.container {
  & .title {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin: 100px 0;
  }

  & .description {
    line-height: 20px;
  }

  & .chart-route {
    position: relative;
  }

  & .airgap-align {
    justify-content: start;
  }
}
</style>
