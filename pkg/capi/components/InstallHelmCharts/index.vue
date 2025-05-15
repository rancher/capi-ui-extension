<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';

import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { WINDOWS, LINUX } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import AsyncButton from '@shell/components/AsyncButton';
import { isPrerelease } from '@shell/utils/version';
import { nextTick } from 'vue';
import { set } from '@shell/utils/object';

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
    // vuex store (probably want management or cluster)
    store: {
      type:    String,
      default: 'cluster'
    },

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

    // consuming component can supply some values to merge with chart values
    extraValues: {
      type:    Object,
      default: () => {
        return {};
      }
    }
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
      this.serverUrlSetting = await this.$store.dispatch(`${ this.store }/find`, {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SERVER_URL,
      });
    } catch (e) {
      console.error('Unable to fetch `server-url` setting: ', e); // eslint-disable-line no-console
    }
    // TODO nb use resourceFetch utils?
    await this.$store.dispatch(`${ this.store }/findAll`, { type: MANAGEMENT.PROJECT });
  },

  data() {
    return {
      serverUrlSetting:       null,
      debouncedRefreshCharts: null,
      versionInfo:            null,
      versionInfoError:       null,
      userValues:             {},
      // payload for 'install' action on clusterrepo resource
      // contains array of chart install info as well as some helm install opts that are set by default in the regular chart install ui
      installCmd:             { charts: [], ...defaultCmdOpts },
      // TODO nb localize
      stages:                 {
        addRepo:           {
          label:        'Add Respository',
          loadingLabel:   'Adding repository...',
          loading:      false,
          done:         false,
          errors:       []
        },
        loadCharts:        {
          label:        'Fetch repository chart(s)',
          loadingLabel:   'Fetching respository chart(s)...',
          loading:      false,
          done:         false,
          errors:       []
        },
        // checkRequirements: {
        //   label:        'Verify system requirements',
        //   loadingLabel:   'Verifying system requirements...',
        //   loading:      false,
        //   done:         false,
        //   errors:       []
        // },
        configureChart:    {
          label:   'Configure Installation Options',
          // loadingLabel:   'Configure Installation Options',
          loading:      false,
          done:         false,
          errors:       []
        },
        installChart:      {
          label:        'Install Chart',
          loadingLabel:   'Installing chart...',
          loading:      false,
          done:         false,
          errors:       []
        }
      },
    };
  },

  watch: {
    targetRepo(neu) {
      if (neu) {
        this.stages.addRepo.done = true;
        this.stages.addRepo.errors = '';

        if (!this.chart) {
          this.fetchRepoCharts();
        }
      }
    },

    chart(neu) {
      if (neu) {
        this.stages.loadCharts.done = true;
        this.stages.loadCharts.errors = '';
        this.fetchVersionInfo();
      }
    },

    // TODO nb check system requirements
    versionInfo(neu) {
      const { chart: chartInfo } = neu;

      this.installCmd.charts[0] = {
        chartName:   this.chartName,
        releaseName: chartInfo.name,
        version:     chartInfo.version,
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.repoName
        },
        // TODO nb include chart values from slots
        // TODO nb use mergeWith... function?
        // this only needs to be values that differ from the default
        values: { ...this.getGlobalValues(), ...this.extraValues }
      };

      this.installCmd.namespace = this.targetNamespace || this.chart?.targetNamespace || 'default';
    }
  },

  methods: {
    async addRepository(btnCb) {
      this.stages.addRepo.loading = true;
      this.stages.addRepo.error = null;

      try {
        // TODO nb nested try block...?
        const repoObj = await this.$store.dispatch(`${ this.store }/create`, {
          type:     CATALOG.CLUSTER_REPO,
          metadata: { name: this.repoName },
          spec:     { url: this.repoUrl },
        });

        try {
          await repoObj.save();
        } catch (e) {
          this.$store.dispatch('growl/fromError', { err: e });
          this.stages.addRepo.loading = false;

          this.stages.addRepo.error = e;

          btnCb(false);

          return;
        }

        this.stages.addRepo.loading = false;
        this.stages.addRepo.done = true;
        await nextTick();
        this.debouncedRefreshCharts();

        btnCb(true);
      } catch (e) {
        this.$store.dispatch('growl/fromError', { err: e });
        this.stages.addRepo.loading = false;

        this.stages.addRepo.error = e;
        btnCb(false);
      }
    },

    // it takes time to fetch a repo's charts when the repo resource is created
    // so we retry loading the chart info using the "refresh" clusterrepo model action
    async fetchRepoCharts() {
      this.stages.loadCharts.loading = true;
      this.stages.loadCharts.error = '';

      let tries = 0;

      while (tries < MAX_TRIES) {
        try {
          tries++;
          await this.targetRepo.refresh();
          if (this.chart) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
        } catch (err) {
          // TODO nb growl?
          // some errors here are expected; should we show them so prominently?
          console.error(err);
        }
      }

      this.stages.loadCharts.loading = false;

      // tried all our tries and the chart still isn't found - tell users something has gone wrong
      if (!this.chart) {
        this.stages.loadCharts.error = `Unable to locate the ${ this.chartName } chart in the ${ this.repoName } repository`;

        // this.$store.dispatch('growl/fromError', { err: `Unable to locate the ${ this.chartName } chart in the ${ this.repoName } repository` });
      } else {
        this.stages.loadCharts.done = true;
      }
    },

    async fetchVersionInfo() {
      // this.stages.checkRequirements.loading = true;
      try {
        // assume we want the latest non-prerelease version
        const targetVersion = (this.chart?.versions || []).find((v) => v.version && !isPrerelease(v.version))?.version;

        if (!targetVersion) {
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
      // this.stages.checkRequirements.loading = false;
      // this.stages.checkRequirements.done = true;
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

      const projects = this.$store.getters[`${ this.store }/all`](MANAGEMENT.PROJECT);

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

    async installChart() {
      let res;

      try {
        res = await this.targetRepo.doAction('install', this.installCmd);
      } catch (err) {
        // TODO nb growl?
        console.error(err);
      }

      console.log('*** chart install response: ', res);
    },

    setValue(key, val) {
      console.log('set ', key, ' to ', val);
      set(this.userValues, key, val);
    }
  },

  computed: {
    // ...mapGetters(['currentCluster']),
    ...mapGetters({
      charts: 'catalog/charts',
      repos:  'catalog/repos',
      t:      'i18n/t'
    }),

    currentCluster() {
      const storeCluster = this.$store.getters['currentCluster'];

      if (storeCluster) {
        return storeCluster;
      }

      return this.$store.getters[`management/byId`](MANAGEMENT.CLUSTER, 'local' );
    },

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
          repoType:  this.repoType,
          chartName: this.chartName
        });
      }

      return null;
    },

    targetRepo() {
      return this.$store.getters['catalog/repo']({ repoType: this.repoType, repoName: this.repoName });
    },

  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <ul class="stages">
      <li
        v-for="stage in stages"
        :key="stage.label"
      >
        <i
          v-if="stage.loading"
          class="icon icon-spinner icon-spin"
        />
        <i
          v-else-if="stage.errors.length"
          class="icon icon-error text-error"
        />
        <i
          v-else-if="stage.done"
          class="icon icon-checkmark text-success"
        />
        <span
          v-else
          class="text-muted"
        > &mdash;</span>

        <label> {{ stage.loading ? stage.loadingLabel : stage.label }} </label>
        <span
          v-if="stage.error"
          class="text-error"
        >{{ stage.error }}</span>
      </li>
    </ul>
    <div v-if="stage.loadCharts.done && chart">
      <slot
        :set-value="setValue"
        :values="userValues"
        name="values"
      />
    </div>
    <AsyncButton
      v-if="!targetRepo"
      type="button"
      class="btn role-primary"
      mode="install"
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
.stages {
  list-style-type: none;
}
</style>
