<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default Vue.extend({
  name:       'ControlPlaneEndpointSection',
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
    ...mapGetters({ t: 'i18n/t' }),
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    }
  }
});
</script>
<template>
  <div>
    <div class="row mb-20">
      <div
        class="col"
      >
        <LabeledInput
          v-model="value.host"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.host')"
          required
        />
      </div>
      <div
        class="col"
      >
        <LabeledInput
          v-model="value.port"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.port')"
          required
        />
      </div>
    </div>
  </div>
</template>
