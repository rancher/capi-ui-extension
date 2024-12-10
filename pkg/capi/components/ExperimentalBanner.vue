<script>
import Banner from '@components/Banner/Banner.vue';

export default {
  name: 'ExperimentalWarningBanner',

  components: { Banner },

};
</script>

<template>
  <Banner
    color="warning"
    label-key="capi.experimental"
  />
</template>
