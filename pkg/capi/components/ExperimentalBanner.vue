<script lang="ts">
import Vue from 'vue';
import Banner from '@components/Banner/Banner.vue';

export default Vue.extend({
  name: 'ExperimentalWarningBanner',

  components: { Banner },

});
</script>

<template><Banner color="warning" label-key="capi.experimental" /></template>
