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
    }
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
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
});
</script>
<template>
  <div>
    <div class="row mb-20">
      <div
        class="col span-3"
      >
        <LabeledInput
          v-model="value.apiServerPort"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.apiServerPort')"
        />
      </div>
      <div
        class="col span-3"
      >
        <LabeledInput
          v-model="value.serviceDomain"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.serviceDomain')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-3">
        <ArrayList
          v-model="value.pods.cidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.pods')"
        />
      </div>
      <div class="col span-3">
        <ArrayList
          v-model="value.services.cidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.services')"
        />
      </div>
    </div>
  </div>
</template>
