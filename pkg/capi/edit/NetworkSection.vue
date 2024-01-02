<script lang="ts">
import { _EDIT } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: {
    LabeledInput,
    ArrayList
  },
  props:      {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    }
  },
  computed: {
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    },
    apiServerPort() {
      return this.value.apiServerPort;
    },
    serviceDomain() {
      return this.value.serviceDomain;
    },
    podsCidrBlocks() {
      return this.value.pods.cidrBlocks;
    },
    servicesCidrBlocks() {
      return this.value.services.cidrBlocks;
    },
  }
};
</script>
<template>
  <div>
    <div class="row mb-20">
      <div
        class="col span-3"
      >
        <LabeledInput
          :value="apiServerPort"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.apiServerPort')"
          @input="$emit('api-server-port-changed', $event)"
        />
      </div>
      <div
        class="col span-3"
      >
        <LabeledInput
          :value="serviceDomain"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.serviceDomain')"
          @input="$emit('service-domain-changed', $event)"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-3">
        <ArrayList
          :value="podsCidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.pods')"
          @input="$emit('pods-cidr-blocks-changed', $event)"
        />
      </div>
      <div class="col span-3">
        <ArrayList
          :value="servicesCidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.services')"
          @input="$emit('services-cidr-blocks-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
