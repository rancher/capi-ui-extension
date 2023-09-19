<script>
import { LABELS } from '../types/capi';
export default {
  name: 'AutoImportStateFormatter',

  props: {
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    value: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    isAutoImport() {
      return this.row.metadata.labels[LABELS.AUTO_IMPORT] === 'true';
    }
  }
};
</script>

<template>
  <i v-if="isAutoImport" class="icon icon-checkmark" />
  <span v-else>&mdash;</span>
</template>
