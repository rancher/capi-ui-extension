<script>
import { mapGetters } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default {
  name: 'NetworkSelection',

  emits:      ['update:value'],
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
  data() {
    return {
      serviceDomain:      this?.value?.clusterNetwork?.serviceDomain || '',
      apiServerPort:      this?.value?.clusterNetwork?.apiServerPort || '',
      podsCidrBlocks:     this?.value?.clusterNetwork?.pods?.cidrBlocks || [],
      servicesCidrBlocks: this?.value?.clusterNetwork?.services?.cidrBlocks || []
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    }
  },
  methods: {
    updateNetwork() {
      if (!this.serviceDomain && !this.apiServerPort && this.podsCidrBlocks.length === 0 && this.servicesCidrBlocks.length === 0) {
        this.$emit('update:value', null);
      } else {
        const res = {};

        if (this.serviceDomain) {
          res.serviceDomain = this.serviceDomain;
        }
        if (this.apiServerPort) {
          res.apiServerPort = parseInt(this.apiServerPort);
        }

        if (this.podsCidrBlocks.length > 0) {
          res.pods = { cidrBlocks: this.podsCidrBlocks };
        }
        if (this.servicesCidrBlocks.length > 0) {
          res.services = { cidrBlocks: this.servicesCidrBlocks };
        }

        this.$emit('update:value', res);
      }
    }
  }
};
</script>
<template>
  <div>
    <div class="row row-networking">
      <div
        class="col col-host span-4 mb-20"
      >
        <LabeledInput
          v-model:value="serviceDomain"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.serviceDomain')"
          :rules="rules.serviceDomain"
          @update:value="updateNetwork"
        />
      </div>
      <div
        class="col col-port span-2 mb-20"
      >
        <LabeledInput
          v-model:value="apiServerPort"
          type="number"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('capi.cluster.networking.apiServerPort')"
          :rules="rules.apiServerPort"
          placeholder="6443"
          @update:value="updateNetwork"
        />
      </div>
    </div>
    <div class="row row-networking">
      <div class="col col-networking span-5 mb-20">
        <ArrayList
          v-model:value="podsCidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.pods.title')"
          :value-placeholder="t('capi.cluster.networking.cidrplaceholder')"
          :rules="rules.pods"
          :add-label="t('capi.cluster.networking.pods.add')"
          component-testid="pods-cidr"
          @update:value="updateNetwork"
        />
      </div>
      <div class="col col-networking span-5 mb-20">
        <ArrayList
          v-model:value="servicesCidrBlocks"
          :protip="false"
          :mode="mode"
          :title="t('capi.cluster.networking.services.title')"
          :value-placeholder="t('capi.cluster.networking.cidrplaceholder')"
          :rules="rules.services"
          :add-label="t('capi.cluster.networking.services.add')"
          component-testid="services-cidr"
          @update:value="updateNetwork"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>

@media screen and (min-width: 1100px) {
    .row-networking {
        width: 200%
    }
}

@media screen and (max-width: 1100px) {
    .row-networking {
        flex-direction: column;
        width: 200%
    }
    .col-port{
        width: 50%;
        min-width: 120px;
    }
    .col-host {
        width: 100%;
        min-width: 120px;
    }
    .col-networking {
        width: 100%
    }
  }
</style>
