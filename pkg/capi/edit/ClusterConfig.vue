<script>
import { CREDENTIALS_UPDATE_REQUIRED, CREDENTIALS_NOT_REQUIRED } from '@pkg/capi/types/capi';
import ClusterClassVariables from '@pkg/capi/components/CCVariables/index';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import FormValidation from '@shell/mixins/form-validation';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabelValue from '@shell/components/LabelValue';
import { set } from '@shell/utils/object';
import { NORMAN } from '@shell/config/types';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { versionValidator } from '@pkg/capi/util/validators';
import { API } from '../config/capi';

import WorkerItem from './WorkerItem';
import NetworkSection from './NetworkSection';

export default {
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    RadioGroup,
    LabeledSelect,
    LabeledInput,
    WorkerItem,
    ClusterClassVariables,
    LabelValue,
    NetworkSection
  },
  mixins: [CreateEditView, FormValidation],
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    provider: {
      type:     String,
      required: true,
    }
  },
  async fetch() {
    await this.getClusterClasses();
    await this.initSpecs();
  },
  data() {
    const stepBasics = {
      name:           'stepBasics',
      title:          this.t('capi.cluster.steps.basics.title'),
      label:          this.t('capi.cluster.steps.basics.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.basics.description',
      ready:          false,
      weight:         30
    };

    const stepConfiguration = {
      name:           'stepConfiguration',
      title:          this.t('capi.cluster.steps.configuration.title'),
      label:          this.t('capi.cluster.steps.configuration.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.configuration.description',
      ready:          false,
      weight:         30
    };

    const addSteps = [stepBasics, stepConfiguration].sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return {
      fvFormRuleSets:          [],
      addSteps,
      credentialId:            '',
      credential:              null,
      versionInfo:             {},
      allNamespaces:           [],
      shouldCreateCredential:  CREDENTIALS_UPDATE_REQUIRED.includes(this.provider),
      providers:               [],
      clusterClasses:          [],
      clusterClass:            '',
      defaultWorkerAddValue:   {
        name:  '',
        class: ''
      },
      variablesReady: true
    };
  },

  watch: {
    shouldCreateCredential(neu) {
    },
    credentialId(val) {
      // console.log(this.credentialId);
      if ( val ) {
        this.credential = this.$store.getters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, this.credentialId);

        if (this.isHarvesterDriver) {
          this.setHarvesterVersionRange();
        }
      } else {
        this.credential = null;
      }
      // console.log(val);
      // this.value.spec.cloudCredentialSecretName = val;
    }
  },
  computed: {
    canUpdateCredential() {
      return !CREDENTIALS_NOT_REQUIRED.includes(this.provider) && !CREDENTIALS_UPDATE_REQUIRED.includes(this.provider);
    },
    modeOptions() {
      return [{
        label: this.t('capi.cluster.secret.reuse'),
        value: false,
      }, {
        label: this.t('capi.cluster.secret.create'),
        value: true,
      }];
    },
    stepOneRequires() {
      return !!this.value.metadata.name && !!this.clusterClass && !!this.variablesReady;
    },
    clusterClassOptions() {
      const out = [];

      this.clusterClasses.forEach((obj) => {
        if (obj?.metadata?.name) {
          out.push(obj.metadata.name);
        }
      });

      return out;
    },

    defaultVersion() {
      return 'v1.27.2+rke2r2';
    },
    clusterNetwork() {
      return this.value.spec.clusterNetwork;
    },
    clusterClassObj() {
      return this.clusterClasses.find(x => x.metadata.name === this.clusterClass);
    },
    clusterClassDescription() {
      return this.clusterClassObj?.metadata?.annotations?.[DESCRIPTION] || this.clusterClassObj?.metadata?.annotations?.description || '';
    },
    machineDeploymentOptions() {
      return this.clusterClassObj?.spec?.workers?.machineDeployments?.map( w => w.class);
    },
    machinePoolOptions() {
      return this.clusterClassObj?.spec?.workers?.machinePools?.map( w => w.class);
    },
    controlPlane() {
      return this.clusterClassObj?.spec?.controlPlane?.ref?.name;
    },
    validationRules() {
      const out = versionValidator(this.$store.getters['i18n/t'], this.controlPlane);

      return out;
    }
  },
  methods: {
    set,
    generateYaml() {},
    async saveOverride(btnCb) {},

    initSpecs() {
      if ( !this.value.spec ) {
        set(this.value, 'spec', { });
      }
      if ( !this.value.spec.topology ) {
        const initTopology = {
          kubernetesVersion: this.defaultVersion,
          class:             '',
          workers:           { machineDeployments: [], machinePools: [] }
        };

        set(this.value.spec, 'topology', initTopology);
      }

      if ( !this.value.spec.clusterNetwork ) {
        const initClusterNetwork = {
          apiServerPort: '6443',
          pods:          { cidrBlocks: [] },
          serviceDomain: '',
          services:      { cidrBlocks: [] }
        };

        set(this.value.spec, 'clusterNetwork', initClusterNetwork);
      }

      // TODO confirm that name is a correct way to identify provider

      const providerInfo = this.providers.find(x => x.metadata.name === this.provider);

      // if (providerInfo?.spec?.secretName) {
      //   this.credentialId = providerInfo?.spec?.secretName;
      //   const creds = await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
      // }
    },

    async getClusterClasses() {
      const allCLusterClasses = await this.$store.dispatch('management/findAll', { type: API.CLUSTER_CLASSES });

      this.clusterClasses = allCLusterClasses.filter(cc => cc.spec.infrastructure.ref.name === this.provider);
    },

    stepOneReady() {
      this.$set(this.addSteps[0], 'ready', this.stepOneRequires);
    },

    cancelCredential() {
      if ( this.$refs.cruresource ) {
        this.$refs.cruresource.emitOrRoute();
      }
    },
    validateVariables(neu) {
      this.variablesReady = neu;
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
    clusterClassChanged() {
      this.stepOneReady();
    }
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    ref="cruresource"
    :mode="mode"
    :validation-passed="true"
    :show-as-form="true"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    :generate-yaml="generateYaml"
    :steps="addSteps"
    :rules="validationRules"
    class="provider"
    component-testid="capi-provider-create"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="fvUnreportedValidationErrors"
  >
    <template #stepBasics>
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="false"
        :namespace-options="allNamespaces"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{name:fvGetAndReportPathRules('metadata.name')}"
        @change="stepOneReady"
      />
      <h2>
        <t k="capi.cluster.providerConfig.title" />
      </h2>

      <div v-if="canUpdateCredential">
        <RadioGroup
          v-model="shouldCreateCredential"
          name="shouldCreateCredential"
          :mode="mode"
          :options="modeOptions"
        />
      </div>
      <div v-if="shouldCreateCredential">
        <!-- TODO -->
      </div>
      <div
        v-else
        class="mt-20"
      >
      </div>

      <div class="row mb-20">
        <div class="col span-3">
          <LabeledSelect
            v-model="clusterClass"
            :mode="mode"
            :options="clusterClassOptions"
            label-key="capi.cluster.clusterClass.label"
            required
            @input="clusterClassChanged"
          />
        </div>
        <div v-if="!!clusterClassDescription">
          <LabelValue
            :name="t('capi.cluster.clusterClass.description')"
            :value="clusterClassDescription"
          />
        </div>
      </div>
      <div class="spacer" />
      <div v-if="!!clusterClassObj">
        <h2>
          <t k="capi.cluster.variables.title" />
        </h2>
        <ClusterClassVariables
          v-model="value.spec.topology.variables"
          :cluster-class="clusterClassObj"
          @validation-passed="(val) => variablesReady = val"
        />
      </div>
    </template>
    <template #stepConfiguration>
      <div class="mt-20">
        <h2>
          <t k="capi.cluster.version.title" />
        </h2>
        <div class="row mb-20">
          <div class="col span-3">
            <LabeledInput
              v-model="value.spec.topology.version"
              :mode="mode"
              label-key="cluster.kubernetesVersion.label"
              required
              @input="$emit('kubernetes-changed', $event)"
            />
          </div>
        </div>
      </div>

      <div class="spacer" />
      <div class="mt-20">
        <h2>
          <t k="capi.cluster.networking.title" />
        </h2>
        <NetworkSection
          v-model="clusterNetwork"
          :mode="mode"
          @api-server-port-changed="(val) => $set(value.spec.clusterNetwork, 'apiServerPort', val)"
          @service-domain-changed="(val) => $set(value.spec.clusterNetwork, 'serviceDomain', val)"
          @pods-cidr-blocks-changed="(val) => $set(value.spec.clusterNetwork.pods, 'cidrBlocks', val)"
          @services-cidr-blocks-changed="(val) => $set(value.spec.clusterNetwork.services, 'cidrBlocks', val)"
        />
      </div>

      <div class="spacer" />
      <div class="mt-20">
        <h2>
          <t k="capi.cluster.workers.title" />
        </h2>
        <div class="row mb-20">
          <div
            v-if="!!machineDeploymentOptions"
            class="col span-3"
          >
            <WorkerItem
              v-model="value.spec.topology.workers.machineDeployments"
              :mode="mode"
              :title="t('capi.cluster.workers.machineDeployments.title')"
              :default-add-value="defaultWorkerAddValue"
              :class-options="machineDeploymentOptions"
              :initial-empty-row="true"
              @input="(val) => $set(value.spec.topology.workers, 'machineDeployments', val)"
            />
          </div>
          <div
            v-if="!!machinePoolOptions"
            class="col span-3"
          >
            <WorkerItem
              v-model="value.spec.topology.workers.machinePools"
              :mode="mode"
              :title="t('capi.cluster.workers.machinePools.title')"
              :default-add-value="defaultWorkerAddValue"
              :class-options="machinePoolOptions"
              :initial-empty-row="true"
              @input="(val) => $set(value.spec.topology.workers, 'machinePools', val)"
            />
          </div>
        </div>
      </div>
    </template>
  </CruResource>
</template>
