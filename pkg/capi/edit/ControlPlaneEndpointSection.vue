<script lang="ts">
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
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
    host() {
      return this.value.host;
    },
    port() {
      return this.value.port;
    },
  }
};
</script>
<template>
  <div>
    <div class="row mb-20">
      <div
        class="col"
      >
        <LabeledInput
          :value="host"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.host')"
          required
          @input="$emit('control-plane-endpoint-host-changed', $event)"
        />
      </div>
      <div
        class="col"
      >
        <LabeledInput
          :value="port"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.port')"
          required
          @input="$emit('control-plane-endpoint-port-changed-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
