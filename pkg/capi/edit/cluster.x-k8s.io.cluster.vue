<script lang="ts">
import { defineComponent } from 'vue';
import Tabbed from '@shell/components/Tabbed.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

import { CAPI } from '../types/capi';
import CCVariables from '../components/CCVariables/index.vue';
const TEST_CC_ID = 'default/quickstart-more-variables';

export default defineComponent({
  name:       'EditCapiCluster',
  components: {
    CCVariables, Tabbed, Tab, LabeledSelect, LabeledInput
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  async fetch() {
    this.$set(this.value, 'spec', { topology: { variables: [], workers: { machineDeployments: [], machinePools: [] } } });
    this.clusterClasses = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });
  },
  data() {
    return {
      clusterClassId:            null,
      clusterClasses:            [],
      variables:                 [],
      variablesValid:            true,
      selectedMachineDeployment: ''
    };
  },

  computed: {

    clusterClassOptions() {
      return (this.clusterClasses || []).map((cc: any) => {
        return { label: cc.metadata.name, value: cc.id };
      });
    },

    clusterClass() {
      return this.clusterClassId && this.clusterClasses ? this.clusterClasses.find(cc => cc.id === this.clusterClassId) : null;
    },

    machineDeploymentOptions() {
      return (this.clusterClass?.spec?.workers?.machineDeployments || []).map((d: any) => d.class);
    }
  },
  methods: {
    addDeployment() {
      const idx = (this.value.spec.topology.workers.machineDeployments || []).length;

      this.value.spec.topology.workers.machineDeployments.push({
        class: this.selectedMachineDeployment, name: `machine-${ idx }`, variables: { overrides: [] }
      });
    }
  }
});
</script>

<template>
  <div>
    <div>Is valid: {{ variablesValid }}</div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect v-if="clusterClasses" v-model="clusterClassId" label="cluster class" :options="clusterClassOptions" />
      </div>
    </div>
    <Tabbed :side-tabs="true">
      <Tab label="Root Variables" name="rootvariables">
        <CCVariables v-if="clusterClass" v-model="variables" :cluster-class="clusterClass" @validation-passed="e=>variablesValid=e" />
      </Tab>
      <Tab v-if="clusterClass" label="Machine Deployment Variables" name="mcvariables">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect v-model="selectedMachineDeployment" label="machine pool class" :options="machineDeploymentOptions" />
          </div>
          <div class="col span-6">
            <button class="btn-sm role-secondary" type="button" label="machine deployment name" @click="addDeployment">
              add
            </button>
          </div>
        </div>
        <template v-for="(md, i) in value.spec.topology.workers.machineDeployments">
          <hr :key="`${md.class}-${i}-hr`" />

          <div :key="`${md.class}-${i}`" class="row mt-10">
            <div class="col span-6">
              <LabeledInput v-model="md.name" label="machine deployment name" />
            </div>
          </div>

          <h3 :key="`${md.class}-${i}-title`" class="mt-20">
            {{ md.class }} Variable Overrides
          </h3>

          <CCVariables
            v-if="clusterClass"
            :key="`${md.class}-${i}-vars`"
            v-model="md.variables.overrides"
            :machine-deployment-class="md.class"
            :cluster-class="clusterClass"
            @validation-passed="e=>variablesValid=e"
          />
        </template>
      </Tab>
    </Tabbed>
  </div>
</template>
