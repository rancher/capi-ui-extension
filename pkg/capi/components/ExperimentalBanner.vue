<script lang="ts">
import { defineComponent } from 'vue';
import Banner from '@components/Banner/Banner.vue';

export default defineComponent({
  name: 'ExperimentalWarningBanner',

  components: { Banner },

});
</script>

<template><Banner color="warning" label-key="capi.experimental" /></template>
