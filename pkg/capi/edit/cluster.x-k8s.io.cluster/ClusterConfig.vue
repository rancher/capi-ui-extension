<script>
import { set, clone } from '@shell/utils/object';
import { clear } from '@shell/utils/array';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import CreateEditView from '@shell/mixins/create-edit-view';
import Labels from '@shell/components/form/Labels.vue';
import { _EDIT } from '@shell/config/query-params';
import ClusterClassVariables from '../../components/CCVariables/index.vue';
import { versionValidator, hostValidator, portValidator, cidrValidator } from '../../util/validators';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import CardGrid from '../../components/CardGrid.vue';
import WorkerItem from './WorkerItem.vue';
import NetworkSection from './NetworkSection.vue';
import ControlPlaneEndpointSection from './ControlPlaneEndpointSection.vue';
import ControlPlaneSection from './ControlPlaneSection.vue';
import { mapGetters } from 'vuex';
import { LABELS, CAPI } from '../../types/capi';
import Loading from '@shell/components/Loading.vue';
import { NAMESPACE, FLEET } from '@shell/config/types';
import Accordion from '@components/Accordion/Accordion.vue';

const defaultTopologyConfig = {
  version: '',
  class:   '',
  workers: { machineDeployments: [], machinePools: [] }
};

export const FORM_SECTIONS = {
  GENERAL:       'general',
  CONTROL_PLANE: 'controlplane',
  NETWORKING:    'networking',
  WORKERS:       'workers',
  LABELS:        'labels'
};

export default {
  name:       'ClusterConfig',
  components: {
    CruResource,
    NameNsDescription,
    LabeledInput,
    WorkerItem,
    NetworkSection,
    ControlPlaneEndpointSection,
    ClusterClassVariables,
    CardGrid,
    Labels,
    ControlPlaneSection,
    Checkbox,
    Loading,
    LabeledSelect,
    Accordion
  },
  mixins: [CreateEditView, FormValidation],
  emits:  ['update:value'],
  props:  {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    preselectedClass: {
      type:     String,
      required: false,
      default:  ''
    },
    clusterClasses: {
      type:     Array,
      required: true
    }
  },

  beforeMount() {
    this.initSpecs().then(() => {
    }).catch((err) => {
      this.errors.push(err);
      this.loading = false;
    });

    this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }).then((res) => {
      this.k3sVersions = res;
    });

    this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }).then((res) => {
      this.rke2Versions = res;
    });
    this.$nextTick(() => {
      this.loading = false;
    });
  },

  data() {
    const store = this.$store;
    const t = store.getters['i18n/t'];
    const stepClusterClass = {
      name:           'stepClusterClass',
      title:          t('capi.cluster.steps.clusterClass.title'),
      label:          t('capi.cluster.steps.clusterClass.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.clusterClass.description',
      ready:          false,
      weight:         30
    };
    const stepConfiguration = {
      name:           'stepConfiguration',
      title:          t('capi.cluster.steps.configuration.title'),
      label:          t('capi.cluster.steps.configuration.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.configuration.description',
      ready:          false,
      weight:         30
    };
    const addSteps = !!this.preselectedClass ? [stepConfiguration] : [stepClusterClass, stepConfiguration];

    return {
      addSteps,
      fvFormRuleSets: [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.topology.version', rules: ['required', 'version'] },
        { path: 'spec.topology.controlPlane.replicas', rules: ['number'] },
        { path: 'spec.controlPlaneEndpoint.host', rules: ['host'] },
        { path: 'spec.controlPlaneEndpoint.port', rules: ['port'] },
        { path: 'spec.clusterNetwork.serviceDomain', rules: ['host'] },
        { path: 'spec.clusterNetwork.apiServerPort', rules: ['port'] },
        { path: 'spec.clusterNetwork.pods.cidrBlocks', rules: ['cidr'] },
        { path: 'spec.clusterNetwork.services.cidrBlocks', rules: ['cidr'] }
      ],
      credentialId:              '',
      credential:                null,
      versionInfo:               {},
      variablesReady:            true,
      variableSectionReady: {
        general:      true,
        controlPlane: true,
        networking:   true,
        misc:         true,
        workers:      true
      },
      clusterClassObj:           null,
      loading:                   true,
      k3sVersions:               [],
      rke2Versions:              [],
      autoImport:                !!this.value?.metadata?.labels && !!this.value?.metadata?.labels[LABELS.AUTO_IMPORT],
      classNamespaceSupported:   false,
      allNamespaces:             [],
      configHighlightOpen:       true,
      controlPlaneHighlightOpen:  true,
      networkingHighlightOpen:   true,
    };
  },

  watch: {
    clusterClassObj(neu) {
      const step = this.addSteps.find((s) => s.name === 'stepClusterClass');

      if (step) {
        step.ready = !!neu;
      }
    },

    stepConfigurationRequires(neu) {
      const step = this.addSteps.find((s) => s.name === 'stepConfiguration');

      step.ready = !!neu;
    },
  },

  computed: {
    ...mapGetters({ t: 'i18n/t', schemaFor: 'management/schemaFor' }),
    fvExtraRules() {
      return {
        version:   versionValidator(this.t, this.clusterClassControlPlane),
        host:      hostValidator(this.t),
        port:      portValidator(this.t),
        cidr:      cidrValidator(this.t)
      };
    },

    formSections() {
      return FORM_SECTIONS;
    },

    machineDeploymentsValid() {
      if (this.value?.spec?.topology?.workers?.machineDeployments && this.value?.spec?.topology?.workers?.machineDeployments.length > 0) {
        for (const deployment of this.value?.spec?.topology?.workers?.machineDeployments) {
          if (!deployment.name || !deployment.class || Number.isNaN(deployment.replicas)) {
            return false;
          }
        }
      }

      return true;
    },

    machinePoolsValid() {
      if (this.value?.spec?.topology?.workers?.machinePools && this.value?.spec?.topology?.workers?.machinePools.length > 0) {
        for (const pool of this.value?.spec?.topology?.workers?.machinePools) {
          if (!pool.name || !pool.class || Number.isNaN(pool.replicas)) {
            return false;
          }
        }
      }

      return true;
    },

    variablesValid() {
      return !Object.values(this.variableSectionReady).includes(false);
    },

    stepConfigurationRequires() {
      const workersValid = ((this.value?.spec?.topology?.workers?.machinePools && this.value?.spec?.topology?.workers?.machinePools.length > 0) ||
         (this.value?.spec?.topology?.workers?.machineDeployments && this.value?.spec?.topology?.workers?.machineDeployments.length > 0)) &&
         this.machineDeploymentsValid && this.machinePoolsValid;

      return this.fvFormIsValid & workersValid && this.variablesValid ;
    },
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    },

    controlPlane: {
      get() {
        return this.value?.spec?.topology?.controlPlane || {};
      },
      set(neu) {
        if (neu) {
          this.value.spec.topology.controlPlane = { replicas: parseInt(neu) };
        } else {
          delete this.value.spec.topology.controlPlane;
        }
      }
    },

    controlPlaneEndpoint: {
      get() {
        return this.value?.spec?.controlPlaneEndpoint || {};
      },
      set(neu) {
        if (!neu) {
          delete this.value.spec.controlPlaneEndpoint;
        } else {
          this.value.spec.controlPlaneEndpoint = neu;
        }
      }
    },

    network: {
      get() {
        return this.value?.spec?.clusterNetwork || {};
      },
      set(neu) {
        if (!neu) {
          delete this.value.spec.clusterNetwork;
        } else {
          this.value.spec.clusterNetwork = neu;
        }
      }
    },

    topology() {
      return this.value?.spec?.topology;
    },
    machineDeployments() {
      return this.value.spec.topology.workers.machineDeployments;
    },

    machinePools() {
      return this.value.spec.topology.workers.machinePools;
    },

    machineDeploymentOptions() {
      return this.clusterClassObj?.spec?.workers?.machineDeployments?.map((w) => w.class);
    },

    machinePoolOptions() {
      return this.clusterClassObj?.spec?.workers?.machinePools?.map((w) => w.class);
    },
    clusterClassControlPlane() {
      return this.clusterClassObj?.spec?.controlPlane?.ref?.kind;
    },

    clusterClassOptions() {
      const out = [];
      const currentObject = this.clusterClassObj;

      this.clusterClasses.forEach((obj) => {
        addType(obj);
      });

      return out;

      function addType(obj) {
        const id = obj?.id;
        const subtype = {
          id,
          obj,
          selected: currentObject === obj
        };

        out.push(subtype);
      }
    },

    canCreateGitRepos() {
      const gitRepoSchema = this.schemaFor(FLEET.GIT_REPO);

      return gitRepoSchema && gitRepoSchema?.collectionMethods.find((x) => x.toLowerCase() === 'post') ;
    },

    isk3s() {
      return this.clusterClassControlPlane === 'KThreesControlPlaneTemplate';
    },

    isRke2() {
      return this.clusterClassControlPlane === 'RKE2ControlPlaneTemplate';
    },

    // if k3s or rke2 use release channel endpoint to get a list of version choices
    // if this property is [] show a plain text input for cp version
    versionOptions() {
      if (this.isK3s) {
        return (this.k3sVersions?.data || []).map((d) => d.version).reverse();
      }

      if (this.isRke2) {
        return (this.rke2Versions?.data || []).map((d) => d.version).reverse();
      }

      return [];
    },

    defaultDeploymentAddValue() {
      let cclass = '';

      if (this.machineDeploymentOptions && this.machineDeploymentOptions.length === 1 ) {
        cclass = this.machineDeploymentOptions[0];
      }

      return {
        name:      '',
        class:     cclass,
        variables: { overrides: [] }
      };
    },

    defaultPoolAddValue() {
      let cclass = '';

      if (this.machinePoolOptions && this.machinePoolOptions.length === 1 ) {
        cclass = this.machinePoolOptions[0];
      }

      return {
        name:      '',
        class:     cclass,
        variables: { overrides: [] }
      };
    },
  },

  methods: {
    set,

    setClassInfo(name) {
      this.clusterClassObj = this.clusterClasses.find((x) => {
        const split = unescape(name).split('/');

        return x.metadata.namespace === split[0] && x.metadata.name === split[1];
      }) || null;
      if (!!this.clusterClassObj) {
        this.setClass();
        this.setClassNamespace();
      } else {
        this.errors.push(this.t('error.clusterClassNotFound'));
      }
    },

    setClass() {
      const clusterClassName = this.clusterClassObj?.metadata?.name;

      this.$emit('update:value', { k: 'spec.topology.class', val: clusterClassName });
    },
    setClassNamespace() {
      const clusterClassNs = this.clusterClassObj?.metadata?.namespace;

      this.$emit('update:value', { k: 'metadata.namespace', val: clusterClassNs });
      if (this.classNamespaceSupported) {
        this.value.spec.topology.classNamespace = clusterClassNs;
      }
    },

    setVariables(vars, names) {
      const removed = (this.value.spec.topology.variables || []).filter((v) => !names.includes(v.name));

      this.value.spec.topology.variables = removed;

      this.value.spec.topology.variables.push(...vars);
    },

    async saveOverride() {
      if (this.errors) {
        clear(this.errors);
      }
      try {
        await this.value.save();

        return this.done();
      } catch (err) {
        this.errors.push(err);
      }
    },

    async initSpecs() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const val = this.value;
      let namespaces = [];

      if ( !val ) {
        set(val, 'spec', { });
        set(val, 'metadata', { labels: {}, annotations: {} });
      }
      if (!val.spec.topology) {
        set(val.spec, 'topology', clone(defaultTopologyConfig));
      }
      this.$emit('update:value', { k: 'spec', val: val.spec });

      if (this.preselectedClass) {
        this.setClassInfo(this.preselectedClass);
      }

      const schema = this.$store.getters[`management/schemaFor`](
        CAPI.CLUSTER
      );

      await schema.fetchResourceFields();
      if ( schema.schemaDefinitions?.[`${ schema.schemaDefinition.type }.spec.topology`]?.resourceFields?.classNamespace ) {
        this.classNamespaceSupported = true;
        namespaces = await this.$store.dispatch(`${ inStore }/findAll`, { type: NAMESPACE });
      }

      this.allNamespaces = namespaces || [];
    },

    cancelCredential() {
      if (this.$refs.cruresource) {
        this.$refs.cruresource.emitOrRoute();
      }
    },

    cancel() {
      this.$router.push({
        name:   'c-cluster-manager-capi',
        params: {},
      });
    },

    done() {
      this.$router.push({
        name:   'c-cluster-manager-capi',
        params: {},
      });
    },

    clickedType(obj) {
      this.clusterClassObj = this.clusterClasses.find((x) => x.id === obj.id) || null;
      this.setClass();
      this.setClassNamespace();
    },
    enableAutoImport(val) {
      if (val) {
        this.value.metadata.labels['cluster-api.cattle.io/rancher-auto-import'] = 'true';
      } else {
        delete this.value.metadata.labels['cluster-api.cattle.io/rancher-auto-import'];
      }
    },

    openRepoModal() {
      this.$store.dispatch('management/promptModal', { component: 'AddExampleRepoDialog', modalWidth: '800px' });
    }
  }
};
</script>
<template>
  <Loading v-if="loading" />

  <CruResource
    v-else
    :mode="mode"
    :show-as-form="true"
    :resource="value"
    :errors="errors"
    :validation-passed="true"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    :steps="addSteps"
    component-testid="capi-cluster-create"
    @done="done"
    @error="e => errors = e"
    @finish="saveOverride"
    @cancel="cancel"
  >
    <template #stepClusterClass>
      <CardGrid
        :rows="clusterClassOptions"
        key-field="id"
        name-field="label"
        side-label-field="tag"
        @clicked="clickedType"
      >
        <template #no-rows>
          <div v-if="canCreateGitRepos">
            It looks like you don't have any cluster classes. Rancher Turtles has a curated collection of sample classes to get you started.
            <div class="mt-20">
              <button
                type="button"
                class="btn role-secondary"
                @click="openRepoModal"
              >
                Add Example Classes
              </button>
            </div>
          </div>
        </template>
        <CardGrid>
        </cardgrid>
      </cardgrid>
    </template>
    <template #stepConfiguration>
      <Accordion
        class="mt-20 section-accordion"
        open-initially
        :title="t(`capi.cluster.section.${formSections.GENERAL}`)"
      >
        <!-- GENERAL CONFIGURATION -->
        <NameNsDescription
          v-if="!isView"
          :value="value"
          :mode="mode"
          :namespaced="classNamespaceSupported"
          :namespace-options="allNamespaces"
          name-label="cluster.name.label"
          name-placeholder="cluster.name.placeholder"
          description-label="cluster.description.label"
          description-placeholder="cluster.description.placeholder"
          :rules="{ name: fvGetAndReportPathRules('metadata.name') }"
          @update:value="$emit('update:value', { k: 'metadata', val: $event.metadata })"
        />
        <div class="mt-30">
          <Checkbox
            v-model:value="autoImport"
            :mode="mode"
            label-key="capi.cluster.labels.autoimport.label"
            :disabled="clusterIsAlreadyCreated"
            @update:value="enableAutoImport"
          />
        </div>
        <div class="row mb-20">
          <div class="col col-half mt-20">
            <LabeledSelect
              v-if="versionOptions.length"
              :mode="mode"
              :value="value.spec.topology.version"
              label-key="cluster.kubernetesVersion.label"
              required
              searchable
              taggable
              :rules="fvGetAndReportPathRules('spec.topology.version')"
              :options="versionOptions"
              @selecting="$emit('update:value', {k: 'spec.topology.version', val: $event})"
            />
            <LabeledInput
              v-else
              v-model:value="value.spec.topology.version"
              :mode="mode"
              label-key="cluster.kubernetesVersion.label"
              required
              :rules="fvGetAndReportPathRules('spec.topology.version')"
              @update:value="$emit('update:value', { k: 'spec.topology.version', val: $event })"
            />
          </div>
        </div>
        <ClusterClassVariables
          :will-open="configHighlightOpen"
          :value="value.spec.topology.variables"
          :section="formSections.GENERAL"
          :cluster-class="clusterClassObj"
          :cluster-namespace="value.metadata?.namespace"

          @update-variables="setVariables"
          @validation-passed="e => variableSectionReady.general = e"
        />
      </Accordion>

      <Accordion
        class="mt-20 section-accordion"
        open-initially
        :title="t(`capi.cluster.section.${formSections.CONTROL_PLANE}`)"
      >
        <!-- CONTROL PLANE CONFIGURATION -->
        <div class="row row-config">
          <div class="col col-half">
            <ControlPlaneEndpointSection
              v-model:value="controlPlaneEndpoint"
              :mode="mode"
              :rules="{ host: fvGetAndReportPathRules('spec.controlPlaneEndpoint.host'), port: fvGetAndReportPathRules('spec.controlPlaneEndpoint.port') }"
            />
          </div>
        </div>
        <div class="row  row-config">
          <div class="col col-half">
            <ControlPlaneSection
              v-model:value="controlPlane"
              :mode="mode"
              :rules="{ replicas: fvGetAndReportPathRules('spec.topology.controlPlane.replicas') }"
            />
          </div>
        </div>
        <ClusterClassVariables
          :will-open="controlPlaneHighlightOpen"
          :value="value.spec.topology.variables"
          :section="formSections.CONTROL_PLANE"
          :cluster-class="clusterClassObj"
          :cluster-namespace="value.metadata?.namespace"

          @update-variables="setVariables"
          @validation-passed="e => variableSectionReady.controlPlane = e"
        />
      </Accordion>

      <Accordion
        class="mt-20"
        open-initially
        :title="t(`capi.cluster.section.${formSections.NETWORKING}`)"
      >
        <!-- NETWORKING CONFIGURATION -->
        <div class="col col-half mt-20">
          <NetworkSection
            v-model:value="network"
            :mode="mode"
            :rules="{
              serviceDomain: fvGetAndReportPathRules('spec.clusterNetwork.serviceDomain'),
              apiServerPort: fvGetAndReportPathRules('spec.clusterNetwork.apiServerPort'),
              pods: fvGetAndReportPathRules('spec.clusterNetwork.pods.cidrBlocks'),
              services: fvGetAndReportPathRules('spec.clusterNetwork.services.cidrBlocks')
            }"
          />
        </div>
        <ClusterClassVariables
          :will-open="networkingHighlightOpen"
          :value="value.spec.topology.variables"
          :cluster-class="clusterClassObj"
          :section="formSections.NETWORKING"
          :cluster-namespace="value.metadata?.namespace"
          @validation-passed="e => variableSectionReady.networking = e"

          @update-variables="setVariables"
        />
      </Accordion>

      <!-- GENERIC VARIABLES -->

      <ClusterClassVariables
        :value="value.spec.topology.variables"
        :cluster-class="clusterClassObj"
        :cluster-namespace="value.metadata?.namespace"
        @update-variables="setVariables"

        @validation-passed="e => variableSectionReady.misc = e"
      />

      <!-- WORKERS -->
      <Accordion
        class="mt-20 section-accordion"
        open-initially
        :title="t(`capi.cluster.section.${formSections.WORKERS}`)"
      >
        <div class="col span-12 mb-20">
          <ClusterClassVariables
            :value="value.spec.topology.variables"
            :section="formSections.WORKERS"
            :cluster-class="clusterClassObj"
            :cluster-namespace="value.metadata?.namespace"

            @update-variables="setVariables"
            @validation-passed="e => variableSectionReady.workers = e"
          />
          <div class="span-12">
            <div
              v-if="!!machineDeploymentOptions"
              class="row"
            >
              <WorkerItem
                v-model:value="machineDeployments"
                :global-variables="value.spec.topology.variables"
                :mode="mode"
                :title="t('capi.cluster.workers.machineDeployments.title')"
                :default-add-value="defaultDeploymentAddValue"
                :class-options="machineDeploymentOptions"
                :initial-empty-row="true"
                :cluster-class="clusterClassObj"
                @update:value="$emit('update:value', { k: 'spec.topology.workers.machineDeployments', val: $event })"
              />
            </div>
            <div
              v-if="!!machinePoolOptions"
              class="row"
            >
              <WorkerItem
                v-model:value="machinePools"
                :global-variables="value.spec.topology.variables"
                :mode="mode"
                :title="t('capi.cluster.workers.machinePools.title')"
                :default-add-value="defaultPoolAddValue"
                :class-options="machinePoolOptions"
                :initial-empty-row="true"
                :cluster-class="clusterClassObj"
                @update:value="$emit('update:value', { k: 'spec.topology.workers.machinePools', val: $event })"
              />
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion
        class="mt-20 section-accordion"
        :title="t(`capi.cluster.section.${formSections.LABELS}`)"
      >
        <Labels
          :value="value"
          :mode="mode"
        />
      </Accordion>
    </template>
  </CruResource>
</template>
<style lang="scss" scoped>
.required {
  color: var(--error);
}
.version {
    width: 65%
}

//custom width for input columns instead of the usual classes (span-*) to simplify variable sizing
:deep(.col-half)  {
  margin-right: 0px;
  width: 50%;
}

:deep(.accordion-container){
  border-radius: 5px;
}

@media screen and (max-width: 1000px) {
  .row-config {
    flex-direction: column;
    width: 100%
  }

  .col-config {
    width: 100%
  }
}
</style>
