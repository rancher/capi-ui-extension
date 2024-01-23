<script lang='ts'>
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';

import Card from '@components/Card/Card.vue';
import ClusterCardField from './ClusterCardField.vue';
import { Worker } from './../../types/capi';

export default defineComponent({
  name:       'ClusterClassCard',
  components: { Card, ClusterCardField },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      cloneData: true,
      errors:    []
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    name() {
      return this.value?.metadata?.name || '';
    },
    description() {
      return this.value?.metadata?.annotations?.description || '';
    },
    controlPlaneName() {
      return this.value?.spec?.controlPlane?.ref?.name;
    },
    controlPlaneKind() {
      return this.value?.spec?.controlPlane?.ref?.kind;
    },
    controlPlaneNamespace() {
      return this.value?.spec?.controlPlane?.ref?.namespace;
    },
    machineDeploymentsCount() {
      return this.value?.spec?.workers?.machineDeployments?.length;
    },
    machineDeploymentsList() {
      return this.value?.spec?.workers?.machineDeployments?.map((w: Worker) => w.class).join(',') || '';
    },
    machinePoolsCount() {
      return this.value?.spec?.workers?.machinePools?.length;
    },
    machinePoolsList() {
      return this.value?.spec?.workers?.machinePools?.map((w: Worker) => w.class).join(',') || '';
    }
  },
});
</script>

<template>
  <Card :show-highlight-border="false" :show-actions="false" class="card">
    <template #body>
      {{ name }}
      <div class="description">
        <p>{{ description }}</p>
      </div>
      <div class="row">
        <div class="col">
          <ClusterCardField
            :value="controlPlaneName"
            :name="t('capi.clusterClassCard.controlPlaneName')"
          />
          <ClusterCardField
            :value="controlPlaneKind"
            :name="t('capi.clusterClassCard.controlPlaneKind')"
          />
          <ClusterCardField
            :value="controlPlaneNamespace"
            :name="t('capi.clusterClassCard.controlPlaneNamespace')"
          />
        </div>
        <div class="col">
          <ClusterCardField
            v-if="machineDeploymentsCount > 0"
            :value="machineDeploymentsList"
            :name="t('capi.clusterClassCard.machineDeploymentsCount',{count: machineDeploymentsCount})"
          />
          <ClusterCardField
            v-if="machinePoolsCount > 0"
            :value="machinePoolsList"
            :name="t('capi.clusterClassCard.machinePoolsCount',{count: machinePoolsCount})"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.description {
  margin-bottom: 10px;
}
.card {
  height: 90%;
}
</style>
