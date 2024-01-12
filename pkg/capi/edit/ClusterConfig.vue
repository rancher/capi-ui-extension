<script lang='ts'>
import {
  CREDENTIALS_UPDATE_REQUIRED, CREDENTIALS_NOT_REQUIRED, CAPIClusterTopology, CAPIClusterNetwork, CAPIClusterCPEndpoint, ClusterClass, CAPI, Worker
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
import CardGrid from './../components/CardGrid';

import WorkerItem from './WorkerItem';
import NetworkSection from './NetworkSection';
import ControlPlaneEndpointSection from './ControlPlaneEndpointSection';

const defaultTopologyConfig: CAPIClusterTopology = {
  version: '',
  class:   '',
  workers:           { machineDeployments: [], machinePools: [] }
};
const defaultClusterNetwork: CAPIClusterNetwork = {
  apiServerPort: 6443,
  pods:          { cidrBlocks: [] },
  serviceDomain: '',
  services:      { cidrBlocks: [] }
};

const defaultCPEndpointConfig: CAPIClusterCPEndpoint = {
  host: '',
  port: 49152
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
    LabelValue,
    NetworkSection,
    ControlPlaneEndpointSection,
    ClusterClassVariables,
    CardGrid
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
    this.clusterClasses = await this.getClusterClasses() || [];
    await this.initSpecs();
  },
  data() {
    const stepClusterClass = {
      name:           'stepClusterClass',
      title:          this.t('capi.cluster.steps.clusterClass.title'),
      label:          this.t('capi.cluster.steps.clusterClass.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.clusterClass.description',
      ready:          true, // false,
      weight:         30
    };
    const stepConfiguration = {
      name:           'stepConfiguration',
      title:          this.t('capi.cluster.steps.configuration.title'),
      label:          this.t('capi.cluster.steps.configuration.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.configuration.description',
      ready:          true, // false,
      weight:         30
    };

    const stepVariables = {
      name:           'stepVariables',
      title:          this.t('capi.cluster.steps.variables.title'),
      label:          this.t('capi.cluster.steps.variables.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.variables.description',
      ready:          true, // false,
      weight:         30
    };

    const addSteps = [stepClusterClass, stepConfiguration, stepVariables].sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return {
      fvFormRuleSets:          [{ path: 'spec.topology.version', rules: [versionValidator] }],
      addSteps,
      credentialId:            '',
      credential:              null,
      versionInfo:             {},
      allNamespaces:           [],
      shouldCreateCredential:  CREDENTIALS_UPDATE_REQUIRED.includes(this.provider),
      defaultWorkerAddValue:   {
        name:  '',
        class: ''
      },
      variablesReady: false,
      clusterClassObj: null
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
      return true;
      // return !!this.value.metadata.name && !!this.clusterClass && !!this.variablesReady;
    },
    stepTwoRequires() {
      return true;
      // const versionTestString = versionTest(this.$store.getters['i18n/t'], this.controlPlane);
      // const versionValid = this.version && !!(this.version.match(versionTestString));
      // const controlPlaneEndpointValid = !!this.value.spec.controlPlaneEndpoint.host && !!this.value.spec.controlPlaneEndpoint.port;
      // const machineDeploymentsValid = this.value.spec.topology.workers.machineDeployments.length > 0 && !!this.value.spec.topology.workers.machineDeployments[0]?.name && !!this.value.spec.topology.workers.machineDeployments[0]?.class;
      // const machinePoolsValid = this.value.spec.topology.workers.machinePools.length > 0 && !!this.value.spec.topology.workers.machinePools[0]?.name && !!this.value.spec.topology.workers.machinePools[0]?.class;

      // return versionValid && controlPlaneEndpointValid && (machineDeploymentsValid || machinePoolsValid);
    },

    clusterNetwork() {
      return this.value.spec.clusterNetwork;
    },
    controlPlaneEndpoint() {
      return this.value.spec.controlPlaneEndpoint;
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
    },
    options() {
      const out: string[] = [];
      const getters = this.$store.getters;

      this.clusterClasses.forEach((obj: ClusterClass) => {
        addType(obj);
      });

      return out;

      function addType(obj: Object, disabled = false) {
        const id = obj?.metadata?.name;
        const label = getters['i18n/withFallback'](`cluster.clusterClass."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';

        const subtype = {
          id,
          obj,
          label,
          description,
          disabled,
          tag,
          selected: true
        };

        out.push(subtype);
      }
    },
  },
  methods: {
    set,
    generateYaml() {},
    async getClusterClasses() {
      const allClusterClasses: ClusterClass[] = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });

      return allClusterClasses.filter(cc => cc.spec.infrastructure.ref.name === this.provider);
    },
    async saveOverride() {
      if ( this.errors ) {
        clear(this.errors);
      }
      console.log(this.value)
      console.log(JSON.stringify(this.value))
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

      if ( !this.value.spec.controlPlaneEndpoint ) {
        set(this.value.spec, 'controlPlaneEndpoint', defaultCPEndpointConfig);
      }
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
    validateVariables(neu: Boolean) {
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
    machineDeploymentsChanged(val: Worker) {
      this.set(this.value.spec.topology.workers, 'machineDeployments', val);
      this.stepTwoReady();
    },
    machinePoolsChanged(val: Worker) {
      this.set(this.value.spec.topology.workers, 'machinePools', val);
      this.stepTwoReady();
    },
    cpEndpointHostChanged(val: String) {
      this.set(this.value.spec.controlPlaneEndpoint, 'host', val);
      this.stepTwoReady();
    },
    cpEndpointPortChanged(val: Number) {
      this.set(this.value.spec.controlPlaneEndpoint, 'port', val);
      this.stepTwoReady();
    },
    clickedType(obj: Object) {
      this.clusterClassObj = this.clusterClasses.find(x => x.metadata.name === obj.id);
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
    <template #stepClusterClass>
      <CardGrid
        :rows="options"
        key-field="id"
        name-field="label"
        side-label-field="tag"
        @clicked="clickedType"
      />
    </template>
    <template #stepConfiguration>
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
      <div v-if="canUpdateCredential">
        <h2>
          <t k="capi.cluster.providerConfig.title" />
        </h2>
        <RadioGroup
          v-model="shouldCreateCredential"
          name="shouldCreateCredential"
          :mode="mode"
          :options="modeOptions"
        />
      </div>
      <div v-if="shouldCreateCredential" class="block">
        <!-- TODO waiting for backend to clarify how we are doing it-->
      </div>
      <div
        v-else
        class="mt-20"
      />
      <div class="row mb-20 ">
        <div class="col span-3">
          <h2>
            <t k="capi.cluster.version.title" />
          </h2>
          <!-- <div class="row mb-20"> -->
          <LabeledInput
            v-model="value.spec.topology.version"
            :mode="mode"
            label-key="cluster.kubernetesVersion.label"
            required
            :rules="versionRule"
            @input="stepTwoReady"
          />
          <!-- </div> -->
        </div>
        <div class="col span-3">
          <h2>
            <t k="capi.cluster.controlPlaneEndpoint.title" />
          </h2>
          <ControlPlaneEndpointSection
            v-model="controlPlaneEndpoint"
            :mode="mode"
          />
        </div>
      </div>
      <div class="mt-20 block">
        <h2>
          <t k="capi.cluster.networking.title" />
        </h2>
        <NetworkSection
          v-model="clusterNetwork"
          :mode="mode"
        />
      </div>
      <div class="mt-20 block">
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
            />
          </div>
        </div>
      </div>
    </template>
    <template #stepVariables>
      <h2>
        <t k="capi.cluster.variables.title" />
      </h2>
      <ClusterClassVariables
        v-model="value.spec.topology.variables"
        :cluster-class="clusterClassObj"
        @validation-passed="validateVariables"
      />
    </template>
  </CruResource>
</template>
<style lang="scss" scoped>
.block {
  margin-bottom: 10px;
}
</style>
