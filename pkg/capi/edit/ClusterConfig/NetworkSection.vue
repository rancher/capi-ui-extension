<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default Vue.extend({
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
    },
    rules: {
      default: () => ({
        serviceDomain:     [],
        apiServerPort:     [],
        pods:              [],
        services:          []
      }),
      type: Object,
    },
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    },
    apiServerPort() {
      return this.value?.apiServerPort;
    },
    serviceDomain() {
      return this.value?.serviceDomain;
    },
    podsCidrBlocks() {
      return this.value?.pods?.cidrBlocks;
    },
    servicesCidrBlocks() {
      return this.value?.services?.cidrBlocks;
    },
  }
});
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
          :rules="rules.apiServerPort"
          required
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
          :rules="rules.serviceDomain"
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
          :rules="rules.pods"
          @input="$emit('pods-cidr-blocks-changed', $event)"
        />
      </div>
      <div class="col span-3">
        <ArrayList
          :value="servicesCidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.services')"
          :rules="rules.services"
          @input="$emit('services-cidr-blocks-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
