<script>
import { set, clone } from '@shell/utils/object';
import { clear } from '@shell/utils/array';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import Labels from '@shell/components/form/Labels.vue';

import ClusterClassVariables from '../../components/CCVariables/index.vue';
import {
  versionValidator, hostValidator, portValidator, cidrValidator, cidrArrayValid
} from '../../util/validators';

import CardGrid from '../../components/CardGrid.vue';
import WorkerItem from './WorkerItem.vue';
import NetworkSection from './NetworkSection.vue';
import ControlPlaneEndpointSection from './ControlPlaneEndpointSection.vue';
import ControlPlaneSection from './ControlPlaneSection.vue';
import Labels from '@shell/components/form/Labels.vue';
import { mapGetters } from 'vuex';

const defaultTopologyConfig = {
  version:      '',
  class:        '',
  workers:           { machineDeployments: [], machinePools: [] }
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
    ControlPlaneSection
  },
  mixins: [CreateEditView, FormValidation],
  emits:  ['update:value'],
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
      type:     Array,
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

    return {
      addSteps,
      fvFormRuleSets:          [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.topology.version', rules: ['required', 'version'] },
        { path: 'spec.topology.controlPlane.replicas', rules: ['number'] },
        { path: 'spec.controlPlaneEndpoint.host', rules: ['host'] },
        { path: 'spec.controlPlaneEndpoint.port', rules: ['port'] },
        { path: 'spec.clusterNetwork.serviceDomain', rules: ['host'] },
        { path: 'spec.clusterNetwork.apiServerPort', rules: ['port'] },
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
      clusterClassObj: null,
      loading:         true
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

    variablesReady(neu) {
      const step = this.addSteps.find((s) => s.name === 'stepVariables');

      step.ready = !!neu;
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    fvExtraRules() {
      return {
        version: versionValidator(this.t, this.clusterClassControlPlane),
        host:    hostValidator(this.t),
        port:    portValidator(this.t),
        cidr:    cidrValidator(this.t)
      };
    },
    controlPlaneEndpointValid() {
        const controlPlaneEndpointPortValid = !portValidator(this.t)(this.value?.spec?.controlPlaneEndpoint?.port);
        const controlPlaneEndpointHostValid = !hostValidator(this.t)(this.value?.spec?.controlPlaneEndpoint?.host);
        return controlPlaneEndpointPortValid && controlPlaneEndpointHostValid;
    },
    controlPlaneValid() {
        return !this.value?.spec?.topology?.controlPlane?.replicas || isNaN(this.value?.spec?.topology?.controlPlane?.replicas)
    },
    networkingValid(){
        const hostValid = !hostValidator(this.t)(this.value?.spec?.clusterNetwork?.serviceDomain);
        const portValid = !portValidator(this.t)(this.value?.spec?.clusterNetwork?.apiServerPort);
      const podsValid = !this.value?.spec?.clusterNetwork?.pods?.cidrBlocks || cidrArrayValid(this.value.spec.clusterNetwork.pods.cidrBlocks);
      const servicesValid = !this.value?.spec?.clusterNetwork?.services?.cidrBlocks || cidrArrayValid(this.value.spec.clusterNetwork.services.cidrBlocks);
      return hostValid && portValid && podsValid && servicesValid;
    },
    machineDeploymentsValid() {
        if(this.value?.spec?.topology?.workers?.machineDeployments.length > 0){
            this.value?.spec?.topology?.workers?.machineDeployments.forEach((deployment)=>{
                if(!deployment.name || !deployment.class || !isNaN(deployment.replicas) ){
                    return false;
                }
            })
        }
        return true;
    },
    machinePoolsValid() {
        if(this.value?.spec?.topology?.workers?.machinePools.length > 0){
            this.value?.spec?.topology?.workers?.machinePools.forEach((pool)=>{
                if(!pool.name || !pool.class || !isNaN(pool.replicas) ){
                    return false;
                }
            })
        }
        return true;
    },
    stepConfigurationRequires() {
      const nameValid = !!this.value.metadata.name;

      const versionValid = this.value?.spec?.topology?.version && !versionValidator(this.t, this.clusterClassControlPlane)(this.value?.spec?.topology?.version);
        const workersValid = ( this.value?.spec?.topology?.workers?.machinePools.length > 0 || this.value?.spec?.topology?.workers?.machineDeployments.length > 0) && this.machineDeploymentsValid && this.machinePoolsValid
      const formValid = nameValid && versionValid && this.controlPlaneEndpointValid && this.controlPlaneValid && this.networkingValid & workersValid;
        console
      return formValid;
    },
    topology() {
      return this.value?.spec?.topology;
    },
    controlPlane() {
      return this.value?.spec?.topology?.controlPlane;
    },
    controlPlaneEndpoint() {
      return this.value?.spec?.controlPlaneEndpoint || {};
    },
    machineDeployments() {
      return this.value.spec.topology.workers.machineDeployments;
    },
    machinePools() {
      return this.value.spec.topology.workers.machinePools;
    },
    machineDeploymentOptions() {
      return this.clusterClassObj?.spec?.workers?.machineDeployments?.map( (w) => w.class);
    },
    machinePoolOptions() {
      return this.clusterClassObj?.spec?.workers?.machinePools?.map( (w) => w.class);
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
  },
  methods: {
    set,
    setClassInfo(name) {
      this.clusterClassObj = this.clusterClasses.find((x) => {
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

      this.$emit('update:value', { k: 'spec.topology.class', val: clusterClassName });
    },
    setNamespace() {
      const clusterClassNs = this.clusterClassObj?.metadata?.namespace;

      this.$emit('update:value', { k: 'metadata.namespace', val: clusterClassNs });
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
      const val = this.value;

      if ( !val ) {
        set(val, 'spec', { });
      }
      if ( !val.spec.topology ) {
        set(val.spec, 'topology', clone(defaultTopologyConfig));
      }
      this.$emit('update:value', { k: 'spec', val: val.spec });

      if ( this.preselectedClass) {
        this.setClassInfo(this.preselectedClass);
      }
    },
    cancelCredential() {
      if ( this.$refs.cruresource ) {
        this.$refs.cruresource.emitOrRoute();
      }
    },
    controlPlaneReplicasChanged(val) {
      if (val) {
        this.value.spec.topology = { ...this.value.spec.topology, ...{ controlPlane: { replicas: parseInt(val) } } };
      } else {
        delete this.value.spec.topology.controlPlane;
      }
    },
    controlPlaneEndpointChanged(val){
        if(!val) {
            delete this.value.spec.controlPlaneEndpoint;
        } else {
            this.value.spec = {...this.value.spec, ...{controlPlaneEndpoint: val}};
        }
    },
    networkChanged(val){
        if(!val) {
            delete this.value.spec.clusterNetwork;
        } else {
            this.value.spec = {...this.value.spec, ...{clusterNetwork: val}};
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
      this.setNamespace();
    }
  }
};
</script>
<template>
  <CruResource
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
        :value="value"
        :mode="mode"
        :namespaced="false"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{name:fvGetAndReportPathRules('metadata.name')}"
        @update:value="$emit('update:value', {k: 'metadata', val: $event.metadata})"
      />
      <div class="row mb-20">
        <div class="col col-config span-4 mt-20">
          <h2>
            <t k="capi.cluster.version.title" />
          </h2>
          <LabeledInput
            :value="value.spec.topology.version"
            :mode="mode"
            label-key="cluster.kubernetesVersion.label"
            required
            :rules="fvGetAndReportPathRules('spec.topology.version')"
            @update:value="$emit('update:value', {k: 'spec.topology.version', val: $event})"
          />
        </div>
      </div>
      <div class="row span-12 row-config">
        <div class="col span-6 mt-20">
          <h2>
            <t k="capi.cluster.controlPlaneEndpoint.title" />
          </h2>
          <ControlPlaneEndpointSection
            v-model:value="controlPlaneEndpoint"
            :mode="mode"
            :rules="{host:fvGetAndReportPathRules('spec.controlPlaneEndpoint.host'), port:fvGetAndReportPathRules('spec.controlPlaneEndpoint.port') }"
            @control-plane-endpoint-changed="controlPlaneEndpointChanged"
          />
        </div>
        <div class="col span-6 mt-20">
          <h2>
            <t k="capi.cluster.topology.controlPlane.title" />
          </h2>
          <ControlPlaneSection
            v-model:value="topology"
            :mode="mode"
            :rules="{replicas:fvGetAndReportPathRules('spec.topology.controlPlane.replicas') }"
            @replicas-changed="controlPlaneReplicasChanged"
            @update:value="$emit('update:value', {k: 'spec.topology.controlPlane', val: $event})"
          />
        </div>
      </div>
      <div class="col span-6 mt-20">
        <h2>
          <t k="capi.cluster.networking.title" />
        </h2>
        <NetworkSection
          v-model:value="value.spec"
          :mode="mode"
          :rules="{
            serviceDomain:fvGetAndReportPathRules('spec.clusterNetwork.serviceDomain'),
            apiServerPort:fvGetAndReportPathRules('spec.clusterNetwork.apiServerPort'),
            pods: fvGetAndReportPathRules('spec.clusterNetwork.pods'),
            services: fvGetAndReportPathRules('spec.clusterNetwork.services')
          }"
          @network-changed="networkChanged"
        />
      </div>
      <div class="col span-12 mt-20 mb-20">
        <h2>
          <t k="capi.cluster.workers.title" />
          <span class="required">*</span>
        </h2>
        <div class="span-12">
          <div
            v-if="!!machineDeploymentOptions"
            class="row"
          >
            <WorkerItem
              :value="machineDeployments"
              :mode="mode"
              :title="t('capi.cluster.workers.machineDeployments.title')"
              :default-add-value="defaultWorkerAddValue"
              :class-options="machineDeploymentOptions"
              :initial-empty-row="true"
              @update:value="$emit('update:value', {k: 'spec.topology.workers.machineDeployments', val: $event})"
            />
          </div>
          <div
            v-if="!!machinePoolOptions"
            class="row"
          >
            <WorkerItem
              :value="machinePools"
              :mode="mode"
              :title="t('capi.cluster.workers.machinePools.title')"
              :default-add-value="defaultWorkerAddValue"
              :class-options="machinePoolOptions"
              :initial-empty-row="true"
              @update:value="$emit('update:value', {k: 'spec.topology.workers.machinePools', val: $event})"
            />
          </div>
        </div>
      </div>
      <div class="mt-20">
        <Labels
          :value="value"
          :mode="mode"
        />
      </div>
    </template>
    <template #stepVariables>
      <h2>
        <t k="capi.cluster.variables.title" />
      </h2>
      <ClusterClassVariables
        :value="value.spec.topology.variables"
        :cluster-class="clusterClassObj"
        @validation-passed="e=>variablesReady=e"
        @update:value="$emit('update:value', {k: 'spec.topology.variables', val: $event})"
      />
    </template>
  </CruResource>
</template>
<style lang="scss" scoped>
.required {
  color: var(--error);
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
