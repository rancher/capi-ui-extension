<script lang="ts">
import { mapGetters } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

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
          v-model:value="value.apiServerPort"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.apiServerPort')"
          :rules="rules.apiServerPort"
          required
        />
      </div>
      <div
        class="col span-3"
      >
        <LabeledInput
          v-model:value="value.serviceDomain"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.serviceDomain')"
          :rules="rules.serviceDomain"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-3">
        <ArrayList
          v-model:value="value.pods.cidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.pods')"
          :rules="rules.pods"
          
        />
      </div>
      <div class="col span-3">
        <ArrayList
          v-model:value="value.services.cidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.services')"
          :rules="rules.services"
          
        />
      </div>
    </div>
  </div>
</template>
