<script>
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { LABELS } from '../types/capi';

export default {
  name: 'CAPIAutoImportConfiguration',

  components: { Checkbox },

  props: {
    // namespace
    resource: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  methods: {
    toggleCapiLabel(e) {
      if (e) {
        this.$set(this.resource.metadata.labels, LABELS.AUTO_IMPORT, 'true');
      } else {
        delete this.resource.metadata.labels[LABELS.AUTO_IMPORT];
      }
    }
  },

  computed: {
    capiLabel() {
      return this.resource?.metadata.labels?.[LABELS.AUTO_IMPORT] === 'true';
    },
    labels() {
      return this.resource.labels;
    }
  },

};
</script>

<template>
  <div>
    <Checkbox
      :value="capiLabel"
      label-key="capi.autoImport.checkbox.label"
      @input="toggleCapiLabel"
    >
      <br />
      {{ {...resource} }}
    </checkbox>
  </div>
</template>
