<script lang='ts'>
import {
  CREDENTIALS_UPDATE_REQUIRED, CREDENTIALS_NOT_REQUIRED, CAPIClusterTopology, CAPIClusterNetwork, ClusterClass, CAPI
} from '@pkg/capi/types/capi';
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
import { versionTest, versionValidator } from '@pkg/capi/util/validators';
import { clear } from '@shell/utils/array';
import { API } from '../config/capi';

import WorkerItem from './WorkerItem';
import NetworkSection from './NetworkSection';

const defaultTopologyConfig: CAPIClusterTopology = {
  version: '',
  class:             '',
  workers:           { machineDeployments: [], machinePools: [] }
};
const defaultClusterNetwork: CAPIClusterNetwork = {
  apiServerPort: 6443,
  pods:          { cidrBlocks: [] },
  serviceDomain: '',
  services:      { cidrBlocks: [] }
};

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
      fvFormRuleSets:          [{ path: 'spec.topology.version', rules: [versionValidator] }],
      addSteps,
      credentialId:            '',
      credential:              null,
      versionInfo:             {},
      allNamespaces:           [],
      shouldCreateCredential:  CREDENTIALS_UPDATE_REQUIRED.includes(this.provider),
      providers:               [],
      clusterClasses:          [],
      defaultWorkerAddValue:   {
        name:  '',
        class: ''
      },
      variablesReady: false,
      clusterClass:   ''
    };
  },

  watch: {
    shouldCreateCredential(neu) {},
    credentialId(val) {
      if ( val ) {
        this.credential = this.$store.getters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, this.credentialId);
      } else {
        this.credential = null;
      }
    }
  },
  computed: {
    // clusterClass: {
    //   get() {
    //     return this.value.spec.topology.class;
    //   },
    //   set(val) {
    //     this.set(this.value.spec.topology, 'class', val);
    //   }
    // },
    version() {
      return this.value.spec.topology.version;
    },
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
    stepTwoRequires() {
      const versionTestString = versionTest(this.$store.getters['i18n/t'], this.controlPlane);
      const versionValid = this.version && !!(this.version.match(versionTestString));
      const machineDeploymentsValid = this.value.spec.topology.workers.machineDeployments.length > 0 && !!this.value.spec.topology.workers.machineDeployments[0]?.name && !!this.value.spec.topology.workers.machineDeployments[0]?.class;
      const machinePoolsValid = this.value.spec.topology.workers.machinePools.length > 0 && !!this.value.spec.topology.workers.machinePools[0]?.name && !!this.value.spec.topology.workers.machinePools[0]?.class;

      return versionValid && (machineDeploymentsValid || machinePoolsValid);
    },
    clusterClassOptions() {
      const out: ClusterClass[] = [];

      this.clusterClasses.forEach((obj: ClusterClass) => {
        if (obj?.metadata?.name) {
          out.push(obj.metadata.name);
        }
      });

      return out;
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
    versionRule() {
      return versionValidator(this.$store.getters['i18n/t'], this.controlPlane);
    }
  },
  methods: {
    set,
    generateYaml() {},
    async saveOverride() {
      if ( this.errors ) {
        clear(this.errors);
      }
      console.log(this.value);
      await this.value.save();

      return this.done();
    },

    initSpecs() {
      if ( !this.value.spec ) {
        set(this.value, 'spec', { });
      }
      if ( !this.value.spec.topology ) {
        set(this.value.spec, 'topology', defaultTopologyConfig);
      }

      if ( !this.value.spec.clusterNetwork ) {
        set(this.value.spec, 'clusterNetwork', defaultClusterNetwork);
      }
    },

    async getClusterClasses() {
      const allClusterClasses: ClusterClass[] = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });

      this.clusterClasses = allClusterClasses.filter(cc => cc.spec.infrastructure.ref.name === this.provider);
    },

    stepOneReady() {
      this.$set(this.addSteps[0], 'ready', this.stepOneRequires);
    },

    stepTwoReady() {
      this.$set(this.addSteps[1], 'ready', this.stepTwoRequires);
    },

    cancelCredential() {
      if ( this.$refs.cruresource ) {
        this.$refs.cruresource.emitOrRoute();
      }
    },
    validateVariables(neu) {
      this.variablesReady = neu;
      this.stepOneReady();
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
    clusterClassChanged(val) {
      this.set(this.value.spec.topology, 'class', val);
      this.stepOneReady();
    },
    machineDeploymentsChanged(val) {
      this.set(this.value.spec.topology.workers, 'machineDeployments', val);
      this.stepTwoReady();
    },
    machinePoolsChanged(val) {
      this.set(this.spec.topology.workers, 'machinePools', val);
      this.stepTwoReady();
    },
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    ref="cruresource"
    :mode="mode"
    :validation-passed="fvFormIsValid"
    :show-as-form="true"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    :generate-yaml="generateYaml"
    :steps="addSteps"
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
        <!-- TODO waiting for backend to clarify how we are doing it-->
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
          @validation-passed="validateVariables"
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
              :rules="versionRule"
              @input="stepTwoReady"
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
              @input="machineDeploymentsChanged"
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
              @input="machinePoolsChanged"
            />
          </div>
        </div>
      </div>
    </template>
  </CruResource>
</template>
