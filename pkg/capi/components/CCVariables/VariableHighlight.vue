<script>
import { ANNOTATIONS } from '../../types/capi';
export default {
  name: 'CCVariableHighlightWrapper',

  props: {
    // clusterclass variable object
    variable: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },

    willOpen: {
      type:    Boolean,
      default: true
    },

  },

  data() {
    return { open: this.willOpen };
  },

  watch: {
    willOpen(neu) {
      this.open = neu;
    },

    highlightColor: {
      immediate: true,
      handler(neu) {
        if (neu === 'error') {
          this.open = true;
        }
      }
    }
  },

  computed: {
    highlightColor() {
      const annotationColor = this.variable?.metadata?.annotations?.[ANNOTATIONS.HIGHLIGHT];
      const searchType = this.variable?.metadata?.annotations?.[ANNOTATIONS.SEARCH_TYPE] || '';

      return annotationColor || searchType ? 'info' : '';
    },

    highlight() {
      return this.variable?.schema?.openAPIV3Schema?.description;
    },

    searchType() {
      return this.variable?.metadata?.annotations?.[ANNOTATIONS.SEARCH_TYPE] || '';
    },

    displayName() {
      return this.$store.getters['i18n/withFallback'](`capi.variables.${ this.variable.name }`, null, this.variable.name);
    },

    required() {
      return this.variable?.required;
    },
  }
};
</script>

<template>
  <!-- TODO nb slot in header to use variable component when toggle -->
  <div
    v-if="!!highlightColor"
    class="ccvar-highlight-container row"
    :class="{open:open, closed:!open, ['info']: highlightColor === 'info', ['warning']: highlightColor === 'warning',['error']: highlightColor === 'error'}"
  >
    <div class="header">
      <h4 class="name">
        {{ displayName }}  <span
          v-if="required"
          class="text-error"
        >*</span>
        <label
          v-if="searchType"
          class="type"
        > | {{ searchType }}</label>
        <Label v-else />
      </h4>
      <i
        class="icon icon-lg"
        :class="{['icon-question-mark']: highlightColor === 'info', ['icon-warning']: highlightColor === 'warning',['icon-error']: highlightColor === 'error',}"
        @click="()=>open=!open"
      >
      </i>
    </div>
    <div class="col span-6">
      <slot />
    </div>
    <Transition name="fade">
      <span
        v-show="open"
        class="highlight col span-6"
      >{{ highlight }}</span>
    </Transition>
  </div>
  <slot v-else />
</template>

<style lang='scss' scoped>
$container-top-padding: 10px;
$container-margin-top-bottom: 50px;
$header-offset: -30px;
$animate-duration: 300ms;

.ccvar-highlight-container{
    // border-top: 1px solid var(--border);
    margin-top: $container-margin-top-bottom;
    padding-top: $container-top-padding;
    padding-right: 1em;
    position: relative;

    .fade-enter-active, .fade-leave-active {
        transition: opacity $animate-duration ease;

    }
    .fade-enter-from, .fade-leave-to {
        opacity: 0;
    }

    &.open {
        border-top: 1px solid var(--border);

    }

    &.info {

        &.open{
            background-image: linear-gradient(var(--info-banner-bg), var(--body-bg));
        //  transition:    background-image linear-gradient(var(--info-banner-bg), var(--body-bg)) 1s;
            transition: opacity $animate-duration ease-in;
            border-color:  var(--info);
            border-image-slice: 100% 0%;
        }

        .icon {
            color: var(--info);
        }
    }

        &.warning {
            &.open{
                background-image: linear-gradient(var(--warning-banner-bg), var(--body-bg));
                border-color:  var(--warning);
                border-image-slice: 100% 0%;
            }

        .icon {
            color: var(--warning);
        }
    }

    .name {
        position: absolute;
        top: $header-offset;
        // left: .25em;
        left: 2em;

    }
    .header .icon {
        cursor-style: pointer;
        position: absolute;
        top: calc($header-offset  + 8px);
        // top: 5px;
        // right: 0.25em;
        left: 0.25em;

    }

    &:nth-child(2) {
        width: 50%;
    }

    .highlight {
        color: var(--text-muted);
        text-align: end;
    }
}
</style>
