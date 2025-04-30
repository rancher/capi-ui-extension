<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { WINDOWS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import AsyncButton from '@shell/components/AsyncButton';
import { isPrerelease } from '@shell/utils/version';

// TODO nb import from install.vue?
// actual POST request looks formatted different and smaller than what is in install.vue
/**
 * Helm CLI options that are not persisted on the back end,
 * but are used for the final install/upgrade operation.
 *
 * NOTE: need to append namespace if installing chart into a ns that doesn't already exist
 */
const defaultCmdOpts = {
  noHooks:                    false,
  timeout:                  '600s',
  wait:                     true,
  disableOpenAPIValidation: false,
  skipCRDs:                 false
};

/**
 * Assumptions made by this component
 * If not in a cluster context, you want to install things in the mgmt cluster //TODO nb
 * You want to use the latest non-pre-release version of the chart
 * You want global values (rancher values) configured just as they would be when using the full install experience
 * Consuming component is responsible for determining:
 *  - if the app is already installed
 *  - if the user has permission to install apps
 * THIS component will check chart for requirement annotations and display warnings as needed
 */

const MAX_TRIES = 5;
const RETRY_WAIT = 500;

export default {
  name: 'InstallHelmCharts',

  components: { AsyncButton },

  props: {
    chartName: {
      type:     String,
      required: true
    },

    repoUrl: {
      type:     String,
      required: true
    },

    repoName: {
      type:     String,
      required: true
    },

    repoType: {
      type:    String,
      default: 'cluster'
    },

    // if not set will use chart targetNamespace. If neither this prop nor chart's targetNamespace are defined, will use default
    targetNamespace: {
      type:    String,
      default: null
    },
  },

  async fetch() {
    this.debouncedRefreshCharts = debounce((init = false) => {
      try {
        this.$store.dispatch('catalog/load', { force: true });
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
      }
    }, 500);

    if (!this.targetRepo || !this.chart) {
      this.debouncedRefreshCharts(true);
    }

    try {
      this.serverUrlSetting = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SERVER_URL,
      });
    } catch (e) {
      console.error('Unable to fetch `server-url` setting: ', e); // eslint-disable-line no-console
    }
    // TODO nb use resourceFetch utils?
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
  },

  data() {
    return {
      serverUrlSetting:       null,
      debouncedRefreshCharts: null,
      versionInfo:            null,
      versionInfoError:       null,
      // payload for 'install' action on clusterrepo resource
      // contains array of chart install info as well as some helm install opts that are set by default in the regular chart install ui
      installCmd:             { charts: [], ...defaultCmdOpts },
    };
  },

  watch: {
    targetRepo() {
      if (!this.chart) {
        this.fetchRepoCharts();
      }
    },

    chart(neu) {
      if (neu) {
        console.log('*** chart found', neu);
        this.fetchVersionInfo();
      }
    },

    versionInfo(neu) {
      const { chart: chartInfo } = neu;

      // TODO nb if versionInfo found initialize the 'chart' object used in install cmd
      // TODO nb add values from chart
      this.installCmd.charts[0] = {
        chartName:   this.chartName,
        releaseName: chartInfo.name,
        version:     chartInfo.version,
        annotations: {
          // TODO nb always cluster?
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: 'cluster',
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.repoName
        },
        values: { ...this.getGlobalValues() }
      };

      this.installCmd.namespace = this.targetNamespace || this.chart?.targetNamespace || 'default';
    }
  },

  methods: {
    async addRepository(btnCb) {
      try {
        // TODO nb probably can't use management here
        // TODO nb nested try block...?
        const repoObj = await this.$store.dispatch('management/create', {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: this.repoName },
          spec:     { url: this.repoUrl },
        });

        try {
          await repoObj.save();
        } catch (e) {
          this.$store.dispatch('growl/fromError', { err: e });
          btnCb(false);

          return;
        }
        this.debouncedRefreshCharts();
        btnCb(true);
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });

        btnCb(false);
      }
    },

    // it takes time to fetch a repo's charts when the repo resource is created
    // so we retry loading the chart info using the "refresh" clusterrepo model action
    async fetchRepoCharts() {
      let tries = 0;

      while (tries < MAX_TRIES) {
        try {
          console.log('*** chart try number ', tries);
          tries++;
          await this.targetRepo.refresh();
          if (this.chart) {
            console.log('*** chart found');
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
        } catch (err) {
          // TODO nb some errors are expected - should we show others to users?
          // this.$store.dispatch('growl/fromError', { err });
          console.error(err);
        }
      }

      // tried all our tries and the chart still isn't found - tell users something has gone wrong
      if (!this.chart) {
        this.$store.dispatch('growl/fromError', { err: `Unable to locate the ${ this.chartName } chart in the ${ this.repoName } repository` });
      }
    },

    async fetchVersionInfo() {
      try {
        console.log('*** fetching version info');
        // assume we want the latest non-prerelease version
        const targetVersion = (this.chart?.versions || []).find((v) => v.version && !isPrerelease(v.version))?.version;

        if (!targetVersion) {
          console.log('*** no target version found');

          return;
        }
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:    this.repoType,
          repoName:    this.repoName,
          chartName:   this.chartName,
          versionName: targetVersion
        });
      } catch (e) {
        // TODO nb growl?
        this.versionInfoError = e;

        console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
      }

      console.log('*** versionInfo fetched: ', this.versionInfo);
    },

    getGlobalValues() {
      let clusterId = '';
      let clusterName = '';

      if (this.currentCluster) {
        clusterId = this.currentCluster?.id;
        clusterName = this.currentCluster.nameDisplay;
      } else {
        clusterId = 'local';
        clusterName = 'local';
      }

      const serverUrl = this.serverUrlSetting?.value || '';
      const rkePathPrefix = this.currentCluster?.spec?.rancherKubernetesEngineConfig?.prefixPath || '';
      const rkeWindowsPathPrefix = this.currentCluster?.spec?.rancherKubernetesEngineConfig?.winPrefixPath || '';
      const isWindows = (this.currentCluster?.workerOSs || []).includes(WINDOWS);

      // TODO nb can we rely on getters here?
      const projects = this.$store.getters['management/all'](MANAGEMENT.PROJECT);

      const systemProjectId = projects.find((p) => p.spec?.displayName === 'System')?.id?.split('/')?.[1] || '';

      const values = {
        global: {
          cattle: {
            clusterName,
            clusterId,
            url: serverUrl,
            rkePathPrefix,
            rkeWindowsPathPrefix,
            systemProjectId
          }
        }
      };

      if (isWindows) {
        values.global.cattle.windows = { enabled: true };
      }

      return values;
    },

    setValue(key, value) {

    },

    installChart() {
      try {
        this.targetRepo.doAction('install', this.installCmd);
      } catch (err) {
        console.error(err);
      }
    },
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts',
      repos:  'catalog/repos',
      t:      'i18n/t'
    }),

    /**
       * [!IMPORTANT]
       * TODO:
       * THIS IS BROKEN
       * When installing, if you add the repo and leave the page
       * then come back, the controllerChart will be null, but so will
       * the targetRepo. This is because the repo is not saved to the store?
       * // TODO nb is this still broken
       */
    chart() {
      if (this.targetRepo) {
        // TODO nb repo type?
        return this.$store.getters['catalog/chart']({
          repoName:  this.repoName,
          repoType:  'cluster',
          chartName: this.chartName
        });
      }

      return null;
    },

    targetRepo() {
      // TODO nb repo type check?
      // return this.repos?.find((repo) => repo?.metadata?.name === this.repoName);
      return this.$store.getters['catalog/repo']({ repoType: 'cluster', repoName: this.repoName });
    },

  }
};
</script>

<template>
  <div>
    <AsyncButton
      v-if="!targetRepo"
      type="button"
      class="btn role-primary"
      mode="create"
      @click="addRepository"
    />

    <div v-if="targetRepo">
      <div v-if="!chart">
        no chart :(
      </div>
      <div v-else>
        u have chart
        <AsyncButton
          type="button"
          class="btn role-primary"
          mode="install"
          @click="installChart"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
