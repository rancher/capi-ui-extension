<script lang='ts'>
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { set } from '@shell/utils/object';
import { clear } from '@shell/utils/array';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import FormValidation from '@shell/mixins/form-validation';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import ClusterClassVariables from '../components/CCVariables/index.vue';
import { versionTest, versionValidator } from '../util/validators';
import {
  CAPIClusterTopology, CAPIClusterNetwork, CAPIClusterCPEndpoint, ClusterClass, CAPI, Worker
} from '../types/capi';
import CardGrid from './../components/CardGrid.vue';
import WorkerItem from './WorkerItem.vue';
import NetworkSection from './NetworkSection.vue';
import ControlPlaneEndpointSection from './ControlPlaneEndpointSection.vue';

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

export default defineComponent({
  name:       'ClusterConfig',
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    LabeledInput,
    WorkerItem,
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
    preselectedClass: {
      type:     String,
      required: false,
      default:  ''
    }
  },
  async fetch() {
    this.clusterClasses = await this.getClusterClasses() || [];
    if ( this.preselectedClass) {
      this.setClassInfo(this.preselectedClass);
    }
    await this.initSpecs();
  },
  data() {
    const stepClusterClass = {
      name:           'stepClusterClass',
      title:          this.t('capi.cluster.steps.clusterClass.title'),
      label:          this.t('capi.cluster.steps.clusterClass.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.clusterClass.description',
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

    const stepVariables = {
      name:           'stepVariables',
      title:          this.t('capi.cluster.steps.variables.title'),
      label:          this.t('capi.cluster.steps.variables.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.variables.description',
      ready:          false,
      weight:         30
    };
    const steps = !!this.preselectedClass ? [stepConfiguration, stepVariables] : [stepClusterClass, stepConfiguration, stepVariables];

    const addSteps = steps.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return {
      fvFormRuleSets:          [{ path: 'spec.topology.version', rules: [versionValidator] }],
      addSteps,
      credentialId:            '',
      credential:              null,
      versionInfo:             {},
      allNamespaces:           [],
      defaultWorkerAddValue:   {
        name:  '',
        class: ''
      },
      variablesReady:  false,
      clusterClassObj: null
    };
  },
  computed: {
    version() {
      return this.value.spec.topology.version;
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
    stepClusterClassRequires() {
      return !!this.clusterClassObj;
    },
    stepConfigurationRequires() {
      const versionTestString = versionTest(this.$store.getters['i18n/t'], this.controlPlane);
      const versionValid = this.version && !!(this.version.match(versionTestString));
      const controlPlaneEndpointValid = !!this.value.spec.controlPlaneEndpoint.host && !!this.value.spec.controlPlaneEndpoint.port;
      const machineDeploymentsValid = this.value.spec.topology.workers.machineDeployments.length > 0 && !!this.value.spec.topology.workers.machineDeployments[0]?.name && !!this.value.spec.topology.workers.machineDeployments[0]?.class;
      const machinePoolsValid = this.value.spec.topology.workers.machinePools.length > 0 && !!this.value.spec.topology.workers.machinePools[0]?.name && !!this.value.spec.topology.workers.machinePools[0]?.class;

      return versionValid && controlPlaneEndpointValid && (machineDeploymentsValid || machinePoolsValid);
    },
    stepVariablesRequires() {
      return !!this.variablesReady;
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
    clusterClassOptions() {
      const out: string[] = [];
      const currentObject = this.clusterClassObj;

      this.clusterClasses.forEach((obj: ClusterClass) => {
        addType(obj);
      });

      return out;

      function addType(obj: Object, disabled = false) {
        const id = obj?.metadata?.name;
        const subtype = {
          id,
          obj,
          selected: currentObject === obj
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

      return allClusterClasses;
    },
    setClassInfo(name: string) {
      this.clusterClassObj = this.clusterClasses.find((x: ClusterClass) => {
        const split = unescape(name).split('/');

        return x.metadata.namespace === split[0] && x.metadata.name === split[1];
      });
    },
    async saveOverride() {
      if ( this.errors ) {
        clear(this.errors);
      }
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

    stepClusterClassReady() {
      const step = this.addSteps.find(s => s.name === 'stepClusterClass');

      this.$set(step, 'ready', this.stepClusterClassRequires);
    },

    stepConfigurationReady() {
      const step = this.addSteps.find(s => s.name === 'stepConfiguration');

      this.$set(step, 'ready', this.stepConfigurationRequires);
    },
    stepVariablesReady() {
      const step = this.addSteps.find(s => s.name === 'stepVariables');

      this.$set(step, 'ready', this.stepVariablesRequires);
    },

    cancelCredential() {
      if ( this.$refs.cruresource ) {
        this.$refs.cruresource.emitOrRoute();
      }
    },
    validateVariables(neu: Boolean) {
      this.variablesReady = neu;
      this.stepVariablesReady();
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
      this.stepConfigurationReady();
    },
    machinePoolsChanged(val: Worker) {
      this.set(this.value.spec.topology.workers, 'machinePools', val);
      this.stepConfigurationReady();
    },
    cpEndpointHostChanged(val: String) {
      this.set(this.value.spec.controlPlaneEndpoint, 'host', val);
      this.stepConfigurationReady();
    },
    cpEndpointPortChanged(val: Number) {
      this.set(this.value.spec.controlPlaneEndpoint, 'port', val);
      this.stepConfigurationReady();
    },
    clickedType(obj: Object) {
      this.clusterClassObj = this.clusterClasses.find(x => x.metadata.name === obj.id);
      this.stepClusterClassReady();
    }
  }
});
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
    component-testid="capi-cluster-create"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="fvUnreportedValidationErrors"
  >
    <template #stepClusterClass>
      <CardGrid
        :rows="clusterClassOptions"
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
        @change="stepConfigurationReady"
      />
      <div class="row mb-20 ">
        <div class="col span-3">
          <h2>
            <t k="capi.cluster.version.title" />
          </h2>
          <LabeledInput
            v-model="value.spec.topology.version"
            :mode="mode"
            label-key="cluster.kubernetesVersion.label"
            required
            :rules="versionRule"
            @input="stepConfigurationReady"
          />
        </div>
        <div class="col ">
          <h2>
            <t k="capi.cluster.controlPlaneEndpoint.title" />
          </h2>
          <ControlPlaneEndpointSection
            v-model="controlPlaneEndpoint"
            :mode="mode"
            @input="stepConfigurationReady"
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
          <span class="required">*</span>
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
              @input="stepConfigurationReady"
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
              @input="stepConfigurationReady"
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
.required {
  color: var(--error);
}
</style>
