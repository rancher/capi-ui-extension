<script>
import { FLEET, NAMESPACE } from '@shell/config/types';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import AsyncButton from '@shell/components/AsyncButton';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import FleetSummary from '@shell/components/fleet/FleetSummary';

const NEW_NAMESPACE = 'turtles-clusterclasses';

const exampleRepo = {
  type:     FLEET.GIT_REPO,
  metadata: { name: 'turtles-examples', namespace: 'fleet-local' },
  spec:     {
    branch:                'main',
    correctDrift:          { enabled: false },
    insecureSkipTLSVerify: false,
    paths:                 [],
    pollingInterval:       '60s',
    repo:                  'https://github.com/rancher/turtles',
    targetNamespace:       NEW_NAMESPACE,
    targets:               [{
      clusterSelector: {
        matchExpressions: [{
          key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
        }]
      }
    }]
  }
};

const REPO_OPTIONS = {
  aws:          'examples/clusterclasses/aws',
  azure:        'examples/clusterclasses/azure',
  docker:       'examples/clusterclasses/docker',
  vsphere:      'examples/clusterclasses/vsphere',
  applications: 'examples/applications'
};

export default {
  emits: ['close'],

  name: 'AddExampleRepoDialog',

  components: {
    Checkbox,
    AsyncButton,
    FleetSummary,
  },

  async fetch() {
    this.gitRepo = await this.$store.dispatch('management/create', exampleRepo );

    if (this.$store.getters[`management/schemaFor`](NAMESPACE)) {
      let existingTurtlesNamespace;

      try {
        existingTurtlesNamespace = await this.$store.dispatch(`management/find`, { type: NAMESPACE, id: NEW_NAMESPACE });
      } catch (err) {}

      if (!existingTurtlesNamespace) {
        this.newNamespace = await this.$store.dispatch('management/create', { type: NAMESPACE, metadata: { name: NEW_NAMESPACE } });
      }
    }
  },

  data() {
    return {
      gitRepo:      {},
      // if a namespace with the name NEW_NAMESPACE isn't found, one will be initialized and stored here
      newNamespace: null,
      repoOptions:  REPO_OPTIONS,
      // once the gitRepo is created this will be populated and filtered
      allBundles:   []
    };
  },

  methods: {
    async loadBundles() {
      const allDispatches = await checkSchemasForFindAllHash({
        allBundles: {
          inStoreType: 'management',
          type:        FLEET.BUNDLE,
          opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
        },
      }, this.$store);

      this.allBundles = allDispatches.allBundles || [];
    },

    async saveGitRepo(cb) {
      if (this.newNamespace) {
        try {
          await this.newNamespace.save();
        } catch (err) {
          this.$store.dispatch('growl/fromError', { title: 'Error creating namespace', err });

          return;
        }
      }

      try {
        await this.gitRepo.save();
        // eslint-disable-next-line node/no-callback-literal
        cb(true);
        this.loadBundles();
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error saving git repo', err });

        // eslint-disable-next-line node/no-callback-literal
        cb(false);
      }
    },

    addPath(path) {
      this.gitRepo.spec.paths.push(path);
    },

    removePath(path) {
      this.gitRepo.spec.paths = this.gitRepo.spec.paths.filter((p) => p !== path);
    },

    goToDetail() {
      this.gitRepo.goToDetail();

      this.$emit('close');
    }
  },

};

</script>

<template>
  <div class="dialog-container">
    <h2>Add Example Clusterclasses</h2>
    <div
      v-if="!gitRepo?.id"
      class="text-label mb-20"
    >
      This will create a fleet git repo resource, <code>turtles-clusterclass-examples</code>, and new namespace in the local cluster,  <code>turtles-clusterclasses</code>, which the example cluster classes will be deployed in. Note that in order for the cluster class resources to be created, you must have already installed the relevant CAPI provider(s).
    </div>
    <div
      v-else
      class="text-label mb-20"
    >
      This dialog may be safely closed. Cluster classes will automatically appear on the page when they become available.
    </div>
    <div v-if="gitRepo && !gitRepo.id">
      <div
        v-for="(path, key) in repoOptions"
        :key="path"
      >
        <Checkbox
          :value="gitRepo?.spec?.paths.includes(path)"
          :label="key"
          @update:value="e=> e ? addPath(path) : removePath(path)"
        />
      </div>
    </div>
    <div
      v-if="gitRepo.id"
      class="row"
    >
      <div class="col span-12">
        <FleetSummary
          v-if="allBundles && allBundles.length"
          :bundles="allBundles"
          :value="gitRepo"
        />
      </div>
    </div>
    <div class="footer-buttons mt-20">
      <AsyncButton
        v-if="!gitRepo.id"
        class="btn role-primary"
        type="button"
        mode="saveGitRepo"
        @click="saveGitRepo"
      />
      <template v-else>
        <a
          href="#"
          @click="goToDetail"
        >
          View GitRepo deployment details
        </a>
        <button
          class="btn role-primary"
          type="button"
          @click="$emit('close')"
        >
          Continue
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.dialog-container {
  padding: 20px;
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;

  &>*{
    margin-left: 10px;
  }
}
</style>
