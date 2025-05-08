<script>
import { mapGetters } from 'vuex';
import { _EDIT } from '@shell/config/query-params';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default {
  name: 'NetworkSelection',

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
      default: () => ({ replicas: [] }),
      type:    Object,
    },
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    clusterIsAlreadyCreated() {
      return this.mode === _EDIT;
    },
    replicas() {
      return this.value?.replicas || '';
    }
  }
};
</script>
<template>
  <div class="row row-cp mb-20">
    <LabeledInput
      :value="replicas"
      :mode="mode"
      :disabled="clusterIsAlreadyCreated"
      :label="t('capi.cluster.topology.controlPlane.replicas')"
      :rules="rules.replicas"
      type="number"
      placeholder="1"
      @update:value="$emit('update:value', $event)"
    />
  </div>
</template>
<style lang="scss" scoped>

@media screen and (min-width: 1100px) {
    .row-cp {
        width: 50%
    }
}

@media screen and (max-width: 1100px) {
    .row-cp {
        flex-direction: column;
        width: 200%
    }
}
</style>
