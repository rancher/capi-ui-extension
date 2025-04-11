<script>
import { mapGetters } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default {
  name:       'ControlPlaneEndpointSection',
  components: { LabeledInput },
  emits:      ['update:value'],
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
        host:   [],
        port:   []
      }),
      type: Object,
    },
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    }
  }
};
</script>
<template>
  <div>
    <div class="row row-cp ">
      <div
        class="col col-host span-5 mb-20"
      >
        <LabeledInput
          v-model:value="value.host"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.host')"
          :rules="rules.host"
        />
      </div>
      <div
        class="col col-port span-4 mb-20"
      >
        <LabeledInput
          v-model:value="value.port"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.port')"
          :rules="rules.port"
          type="number"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>

@media screen and (min-width: 900px) {
    // .row-cp {
    //     flex-direction: column;
    //     width: 100%
    // }
    .col-port {
        width: 30%
    }
    .col-host {
        width: 70%
    }
}

@media screen and (max-width: 900px) {
    .row-cp {
        flex-direction: column;
        width: 100%
    }
    .col-port {
        width: 75%
    }
    .col-host {
        width: 75%
    }
}
</style>
