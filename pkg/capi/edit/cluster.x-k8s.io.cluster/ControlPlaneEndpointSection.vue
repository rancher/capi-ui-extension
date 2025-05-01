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
  data() {
    return {
      host: this?.value?.host || '',
      port: this?.value?.port || ''
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    }
  },
  methods: {
    updateControlPlaneEndpoint() {
      if (!this.host && !this.port) {
        this.$emit('update:value', null);
      } else {
        const res = {};

        if (this.host) {
          res.host = this.host;
        }
        if (this.port) {
          res.port = parseInt(this.port);
        }
        this.$emit('update:value', res);
      }
    }
  }
};
</script>
<template>
  <div>
    <div class="row row-cp ">
      <div
        class="col col-host span-4 mb-20"
      >
        <LabeledInput
          v-model:value="host"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.host')"
          :rules="rules.host"
          @update:value="updateControlPlaneEndpoint"
        />
      </div>
      <div
        class="col col-port span-2 mb-20"
      >
        <LabeledInput
          v-model:value="port"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.controlPlaneEndpoint.port')"
          :rules="rules.port"
          type="number"
          placeholder="49152"
          @update:value="updateControlPlaneEndpoint"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>

@media screen and (min-width: 1000px) {
    .row-cp {
        width: 200%
    }
}

@media screen and (max-width: 1000px) {
    .row-cp {
        flex-direction: column;
        width: 100%
    }
    .col-port {
        width: 100%
    }
    .col-host {
        width: 200%
    }
}
</style>
