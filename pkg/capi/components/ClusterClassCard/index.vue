<script lang='ts'>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import ClusterCardField from './ClusterCardField.vue';
import { Worker } from './../../types/capi';

export default Vue.extend({
  name:       'ClusterClassCard',
  components: { ClusterCardField },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    selected: {
      type:    Boolean,
      default: false
    }
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
  <div
    class="cluster-card-container"
    :class="{selected: !!selected}"
    data-testid="cluster-class-card"
  >
    <div class="card-wrap">
      <div class="name">
        {{ name }}
      </div>
      <div class="description">
        <p>{{ description }}</p>
      </div>
      <div class="container">
        <div class="leftcol">
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
        <div class="rightcol">
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
 .cluster-card-container {
  display: flex;
  flex-basis: 40%;
  margin: 10px;
  min-height: 100px;
  padding: 10px 20px;
  height: 90%;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  &.selected {
    border: 2px solid var(--app-rancher-accent );
  }
  &:hover {
    box-shadow: 0 0 30px var(--shadow);
    transition: box-shadow 0.1s ease-in-out;
    cursor: pointer;
    text-decoration: none !important;
  }
  &.rancher {
    .side-label, .deploys-os-label {
      background-color: var(--app-rancher-accent);
      label {
        color: var(--app-rancher-accent-text);
      }
    }
    &:hover {
      border-color: var(--app-rancher-accent);
    }
  }

  &.partner {
    .side-label, .deploys-os-label {
      background-color: var(--app-partner-accent);
      label {
        color: var(--app-partner-accent-text);
      }
    }
    &:hover {
      border-color: var(--app-partner-accent);
    }
  }

  .card-wrap {
    width: 100%;
  }

 }
.name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;

}
.description {
  font-size: 14px;
  margin-bottom: 20px;
}
.container{
  display: grid;
  padding: 0px;
  grid-template-columns: 1fr 1fr;
  @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
    grid-template-columns: 1fr;
  }

}
.leftcol {
  justify-self: start;
  margin-right: 10px;
}
.rightcol{
  justify-self: end;
  @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
    justify-self: start;
  }
}

</style>
