<script>
import { ANNOTATIONS } from '../../types/capi';
export default {
  name: 'CCvariableDefHighlightWrapper',

  props: {
    // clusterclass variableDef object
    variableDef: {
      type:     Object,
      required: true
    },

    // variable value as set in cluster spec
    // OR machine overrides depending on where this component is used
    variableValue: {
      type:    [Object, String, Number, Array, Boolean],
      default: null
    },

    mode: {
      type:    String,
      default: 'create'
    },

    willOpen: {
      type:    Boolean,
      default: true
    },

    isToggle: {
      type:    Boolean,
      default: false
    },

  },

  data() {
    // if this is a toggle switch, show info when it is open
    // error highlights are shown initially no matter what
    return { open: this.isToggle ? !!this.variableValue : this.willOpen };
  },

  watch: {

    willOpen(neu) {
      this.open = neu;
    },

    variableValue(neu) {
      if (this.isToggle && neu) {
        this.open = neu;
      }
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

  methods: {
    toggleOpen(o) {
      this.open = o;
    },
  },

  computed: {
    highlightColor() {
      const annotationColor = this.variableDef?.metadata?.annotations?.[ANNOTATIONS.HIGHLIGHT];
      const searchType = this.variableDef?.metadata?.annotations?.[ANNOTATIONS.SEARCH_TYPE] || '';

      return annotationColor || searchType ? annotationColor || 'info' : '';
    },

    highlight() {
      return this.variableDef?.schema?.openAPIV3Schema?.description;
    },

    searchType() {
      return this.variableDef?.metadata?.annotations?.[ANNOTATIONS.SEARCH_TYPE] || '';
    },

    displayName() {
      return this.$store.getters['i18n/withFallback'](`capi.variableDefs.${ this.variableDef.name }`, null, this.variableDef.name);
    },

    required() {
      return this.variableDef?.required;
    },

  }
};
</script>

<template>
  <div
    v-if="!!highlightColor"
    class="ccvar-highlight-container"
    :class="{open:open, closed:!open, toggle:isToggle, ['info']: highlightColor === 'info', ['warning']: highlightColor === 'warning',['error']: highlightColor === 'error'}"
  >
    <div class="left-container">
      <div
        v-if="!isToggle"
        class="header"
      >
        <!-- <div class="toggle-input-container">
        <slot
          :toggle="e=>open=!!e"
          name="header"
        >
        </slot>
      </div> -->
        <h4 class="name">
          <i
            class="icon"
            :class="{['icon-question-mark']: highlightColor === 'info', ['icon-warning']: highlightColor === 'warning',['icon-error']: highlightColor === 'error',}"
            @click="toggleOpen(!open)"
          >
          </i>
          {{ displayName }}  <span
            v-if="required"
            class="text-error"
          >*</span>
        </h4>
        <label
          v-if="searchType"
          class="type"
        > {{ searchType }}</label>
        <Label v-else />
      </div>
      <div class="var-input">
        <slot
          name="highlight"
          :toggle-open="toggleOpen"
        />
      </div>
    </div>
    <div class="right-container">
      <Transition name="fade">
        <div
          v-show="open"
          class="highlight"
        >
          {{ highlight }}
          <i
            class="icon"
            :class="{['icon-question-mark']: highlightColor === 'info', ['icon-warning']: highlightColor === 'warning',['icon-error']: highlightColor === 'error',}"
            @click="!isToggle ? toggleOpen : ()=>{}"
          >
          </i>
        </div>
      </Transition>
    </div>
  </div>
  <slot
    v-else
    name="highlight"
    :toggle-open="toggleOpen"
  />
</template>

<style lang='scss' scoped>
$container-top-padding: 10px;
$container-margin-top-bottom: 15px;
$header-offset: -30px;
$animate-duration: 300ms;
$left-basis: 50%;
$right-basis: 50%;
$header-height: 3em;  // position info text below header

.ccvar-highlight-container{
    margin-top: $container-margin-top-bottom;
    padding-top: $container-top-padding;
    // padding-right: 1em;
    position: relative;
    display:flex;
    justify-content: space-between;

    .fade-enter-active, .fade-leave-active {
        transition: opacity $animate-duration ease;

    }
    .fade-enter-from, .fade-leave-to {
        opacity: 0;
    }

    .left-container {
        flex-basis: $left-basis;
    }

    .right-container {
        flex-basis: $right-basis;
        padding-top: 5px;
        color: var(--disabled-text);
        // align-content: center;
    }

    &.toggle .right-container  {
        flex-basis: calc($right-basis * 3);

    }

    .header {
        padding-bottom: calc($header-height/3);
        display: flex;
        justify-content: flex-start;
        align-items: end;

        .name {
            margin-bottom: 0px;
        }
        .type  {
            margin-bottom: 0px;
            padding-left: 5px;
        }
    }

    .highlight {
        text-align: end;
        padding: 10px 0 2em 4em;
        // padding-left: 4em;
        // padding-bottom: 1em;
         i {
            display: block;
            position: absolute;
            right: 5px;
            bottom: 5px;
         }
    }

    &.info {
        i {
            color: var(--info);

        }
    }

    &.warning {
        i {
            color: var(--warning);
        }
    }

    &.open.info {

        .right-container {
            padding-right: 3px;
            border-right: 1px solid var(--info);
            background-image: linear-gradient(to left, var(--info-banner-bg), var(--body-bg));
            transition:    background-image linear-gradient(to left, var(--info-banner-bg), var(--body-bg)) 1s;
        }
    }

    &.open.warning {

        .right-container {
            padding-right: 3px;
            border-right: 1px solid var(--warning);
            background-image: linear-gradient(to left, var(--warning-banner-bg), var(--body-bg));
            transition:    background-image linear-gradient(to left, var(--warning-banner-bg), var(--body-bg)) 1s;
        }
    }


}
</style>
