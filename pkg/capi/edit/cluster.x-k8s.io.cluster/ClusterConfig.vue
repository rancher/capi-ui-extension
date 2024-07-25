<script lang='ts'>
import { defineComponent, PropType } from 'vue';
import { set, clone } from '@shell/utils/object';
import { clear } from '@shell/utils/array';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import FormValidation from '@shell/mixins/form-validation';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Translation } from '@rancher/shell/types/t';
import ClusterClassVariables from '../../components/CCVariables/index.vue';
import {
  versionTest, versionValidator, hostValidator, portValidator, cidrValidator, cidrArrayValid
} from '../../util/validators';
import {
  CAPIClusterTopology, CAPIClusterNetwork, CAPIClusterCPEndpoint, ClusterClass, Worker
} from '../../types/capi';
import CardGrid from '../../components/CardGrid.vue';
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

interface Step {
  name: String
}

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
    },
    clusterClasses: {
      type:     Array as PropType<ClusterClass[]>,
      required: true
    }
  },
  beforeMount() {
    this.initSpecs();
    this.$nextTick(() => {
      this.loading = false;
    });
  },
  data() {
    const store = this.$store as {[key: string]: any};
    const t = store.getters['i18n/t'] as Translation;
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

    const stepVariables = {
      name:           'stepVariables',
      title:          t('capi.cluster.steps.variables.title'),
      label:          t('capi.cluster.steps.variables.label'),
      subtext:        '',
      descriptionKey: 'capi.cluster.steps.variables.description',
      ready:          true,
      weight:         30
    };
    const addSteps = !!this.preselectedClass ? [stepConfiguration, stepVariables] : [stepClusterClass, stepConfiguration, stepVariables];
    const clusterClassObj: ClusterClass | null = null;

    return {
      addSteps,
      fvFormRuleSets:          [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.topology.version', rules: ['required', 'version'] },
        { path: 'spec.controlPlaneEndpoint.host', rules: ['host'] },
        { path: 'spec.controlPlaneEndpoint.port', rules: ['port'] },
        { path: 'spec.clusterNetwork.serviceDomain', rules: ['host'] },
        { path: 'spec.clusterNetwork.apiServerPort', rules: ['required', 'port'] },
        { path: 'spec.clusterNetwork.pods', rules: ['cidr'] },
        { path: 'spec.clusterNetwork.services', rules: ['cidr'] }
      ],
      credentialId:            '',
      credential:              null,
      versionInfo:             {},
      defaultWorkerAddValue:   {
        name:  '',
        class: ''
      },
      variablesReady:  true,
      clusterClassObj,
      loading:         true
    };
  },

  watch: {
    clusterClassObj(neu) {
      const step = this.addSteps.find((s: Step) => s.name === 'stepClusterClass');

      if (step) {
        this.$set(step, 'ready', !!neu);
      }
    },

    stepConfigurationRequires(neu) {
      const step = this.addSteps.find((s: Step) => s.name === 'stepConfiguration');

      this.$set(step, 'ready', neu);
    },

    variablesReady(neu) {
      const step = this.addSteps.find((s: Step) => s.name === 'stepVariables');

      this.$set(step, 'ready', neu);
    }
  },

  computed: {
    modeOptions() {
      return [{
        label: this.t('capi.cluster.secret.reuse'),
        value: false,
      }, {
        label: this.t('capi.cluster.secret.create'),
        value: true,
      }];
    },
    fvExtraRules() {
      return {
        version: versionValidator(this.$store.getters['i18n/t'], this.controlPlane),
        host:    hostValidator(this.$store.getters['i18n/t']),
        port:    portValidator(this.$store.getters['i18n/t']),
        cidr:    cidrValidator(this.$store.getters['i18n/t'])
      };
    },
    stepConfigurationRequires() {
      const nameValid: boolean = !!this.value.metadata.name;
      const versionTestString: RegExp = versionTest(this.$store.getters['i18n/t'], this.controlPlane);
      const versionValid: boolean = this.value?.spec?.topology?.version && !!(this.value?.spec?.topology?.version.match(versionTestString));
      const controlPlaneEndpointPortValid: boolean = !portValidator(this.$store.getters['i18n/t'])(this.value?.spec?.controlPlaneEndpoint?.port);
      const controlPlaneEndpointHostValid: boolean = !hostValidator(this.$store.getters['i18n/t'])(this.value?.spec?.controlPlaneEndpoint?.host);
      const machineDeploymentsValid: boolean = this.value?.spec?.topology?.workers?.machineDeployments?.length > 0 && !!this.value?.spec?.topology?.workers?.machineDeployments[0]?.name && !!this.value?.spec?.topology?.workers?.machineDeployments[0]?.class;
      const machinePoolsValid: boolean = this.value?.spec?.topology?.workers?.machinePools?.length > 0 && !!this.value?.spec?.topology?.workers?.machinePools[0]?.name && !!this.value?.spec?.topology?.workers?.machinePools[0]?.class;
      const networkPodsValid: boolean = !this.value?.spec?.clusterNetwork?.pods?.cidrBlocks || cidrArrayValid(this.value.spec.clusterNetwork.pods.cidrBlocks);
      const networkServicesValid: boolean = !this.value?.spec?.clusterNetwork?.services?.cidrBlocks || cidrArrayValid(this.value.spec.clusterNetwork.services.cidrBlocks);
      const networkValid:boolean = !!this.value?.spec?.clusterNetwork?.apiServerPort && !isNaN(this.value?.spec?.clusterNetwork?.apiServerPort) && networkPodsValid && networkServicesValid;

      return nameValid && versionValid && controlPlaneEndpointHostValid && controlPlaneEndpointPortValid && networkValid && (machineDeploymentsValid || machinePoolsValid);
    },
    clusterNetwork() {
      return this.value?.spec?.clusterNetwork;
    },
    controlPlaneEndpoint() {
      return this.value?.spec?.controlPlaneEndpoint;
    },
    machineDeploymentOptions() {
      return this.clusterClassObj?.spec?.workers?.machineDeployments?.map( (w: Worker) => w.class);
    },
    machinePoolOptions() {
      return this.clusterClassObj?.spec?.workers?.machinePools?.map( (w: Worker) => w.class);
    },
    controlPlane() {
      return this.clusterClassObj?.spec?.controlPlane?.ref?.name;
    },
    clusterClassOptions() {
      const out: any[] = [];
      const currentObject = this.clusterClassObj;

      this.clusterClasses.forEach((obj: ClusterClass) => {
        addType(obj);
      });

      return out;

      function addType(obj: {[key: string]: any}) {
        const id = obj?.id;
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
    setClassInfo(name: string) {
      this.clusterClassObj = this.clusterClasses.find((x: ClusterClass) => {
        const split = unescape(name).split('/');

        return x.metadata.namespace === split[0] && x.metadata.name === split[1];
      }) || null;
      if ( !!this.clusterClassObj ) {
        this.setClass();
        this.setNamespace();
      } else {
        this.errors.push(this.t('error.clusterClassNotFound'));
      }
    },
    setClass() {
      const clusterClassName = this.clusterClassObj?.metadata?.name;

      this.set(this.value.spec.topology, 'class', clusterClassName);
    },
    setNamespace() {
      const clusterClassNs = this.clusterClassObj?.metadata?.namespace;

      this.set(this.value.metadata, 'namespace', clusterClassNs);
    },
    async saveOverride() {
      if ( this.errors ) {
        clear(this.errors);
      }
      try {
        await this.value.save();

        return this.done();
      } catch (err) {
        this.errors.push(err);
      }
    },

    initSpecs() {
      if ( !this.value.spec ) {
        set(this.value, 'spec', { });
      }
      if ( !this.value.spec.topology ) {
        set(this.value.spec, 'topology', clone(defaultTopologyConfig));
      }

      if ( !this.value.spec.clusterNetwork ) {
        set(this.value.spec, 'clusterNetwork', clone(defaultClusterNetwork));
      }

      if ( !this.value.spec.controlPlaneEndpoint ) {
        set(this.value.spec, 'controlPlaneEndpoint', clone(defaultCPEndpointConfig));
      }
      if ( this.preselectedClass) {
        this.setClassInfo(this.preselectedClass);
      }
    },
    cancelCredential() {
      if ( this.$refs.cruresource ) {
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
    clickedType(obj: {[key:string]: any}) {
      this.clusterClassObj = this.clusterClasses.find((x: ClusterClass) => x.id === obj.id) || null;
      this.setClass();
      this.setNamespace();
    },
    podsCidrBlocksChanged(val: string[]) {
      if ( !this.value.spec.clusterNetwork?.pods ) {
        set(this.value.spec.clusterNetwork, 'pods', []);
      }
      set(this.value.spec.clusterNetwork.pods, 'cidrBlocks', val);
    },
    servicesCidrBlocksChanged(val: string[]) {
      if ( !this.value.spec.clusterNetwork?.services ) {
        set(this.value.spec.clusterNetwork, 'services', []);
      }
      set(this.value.spec.clusterNetwork.services, 'cidrBlocks', val);
    }
  }
});
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
    @error="e=>errors = e"
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
      />
    </template>
    <template #stepConfiguration>
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="false"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{name:fvGetAndReportPathRules('metadata.name')}"
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
            :rules="fvGetAndReportPathRules('spec.topology.version')"
          />
        </div>
        <div class="col ">
          <h2>
            <t k="capi.cluster.controlPlaneEndpoint.title" />
          </h2>
          <ControlPlaneEndpointSection
            v-model="controlPlaneEndpoint"
            :mode="mode"
            :rules="{host:fvGetAndReportPathRules('spec.controlPlaneEndpoint.host'), port:fvGetAndReportPathRules('spec.controlPlaneEndpoint.port') }"
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
          :rules="{
            serviceDomain:fvGetAndReportPathRules('spec.clusterNetwork.serviceDomain'),
            apiServerPort:fvGetAndReportPathRules('spec.clusterNetwork.apiServerPort'),
            pods: fvGetAndReportPathRules('spec.clusterNetwork.pods'),
            services: fvGetAndReportPathRules('spec.clusterNetwork.services')
          }"
          @api-server-port-changed="(val) => $set(value.spec.clusterNetwork, 'apiServerPort', Number(val) || '')"
          @service-domain-changed="(val) => $set(value.spec.clusterNetwork, 'serviceDomain', val)"
          @pods-cidr-blocks-changed="podsCidrBlocksChanged"
          @services-cidr-blocks-changed="servicesCidrBlocksChanged"
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
        @validation-passed="e=>variablesReady=e"
      />
    </template>
  </CruResource>
</template>
<style lang="scss" scoped>
.required {
  color: var(--error);
}
</style>
