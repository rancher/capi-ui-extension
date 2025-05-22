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

    isToggle: {
      type:    Boolean,
      default: false
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
  <div
    v-if="!!highlightColor"
    class="ccvar-highlight-container"
    :class="{open:open, closed:!open, toggle:isToggle, ['info']: highlightColor === 'info', ['warning']: highlightColor === 'warning',['error']: highlightColor === 'error'}"
  >
    <div class="left-container">
      <div class="header">
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
            @click="()=>open=!open"
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
        <slot />
      </div>
    </div>
    <div class="right-container">
      <Transition name="fade">
        <div
          v-show="open"
          class="highlight"
        >
          <i
            class="icon"
            :class="{['icon-question-mark']: highlightColor === 'info', ['icon-warning']: highlightColor === 'warning',['icon-error']: highlightColor === 'error',}"
            @click="()=>open=!open"
          >
          </i>
          {{ highlight }}
        </div>
      </Transition>
    </div>
  </div>
  <slot v-else />
</template>

<style lang='scss' scoped>
$container-top-padding: 10px;
$container-margin-top-bottom: 50px;
$header-offset: -30px;
$animate-duration: 300ms;
$left-basis: 50%;
$right-basis: 50%;
$header-height: 3em;  // position info text below header

.ccvar-highlight-container{
    margin-top: $container-margin-top-bottom;
    padding-top: $container-top-padding;
    padding-right: 1em;
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
        padding-top:$header-height;

        color: var(--disabled-text);
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
         i {
            display: block;
         }
    }

    &.info {
        i {
            color: var(--info);
        }
    }

    &.open.info {

        .highlight {
            // padding-right: 3px;
            // border-right: 3px solid var(--info);
            //     // border-color:  var(--info);
            //                     background-image: linear-gradient(to left, var(--info-banner-bg), var(--body-bg));
            //  transition:    background-image linear-gradient(to left, var(--info-banner-bg), var(--body-bg)) 1s;
        }

        .right-container {
            padding-right: 3px;
            border-right: 3px solid var(--info);
                // border-color:  var(--info);
                                background-image: linear-gradient(to left, var(--info-banner-bg), var(--body-bg));
             transition:    background-image linear-gradient(to left, var(--info-banner-bg), var(--body-bg)) 1s;
        }
    }

    //coloration when open
    .open {
        &.info {
            & .highlight{
                // background-image: linear-gradient(var(--info-banner-bg), var(--body-bg));
            //  transition:    background-image linear-gradient(var(--info-banner-bg), var(--body-bg)) 1s;
                transition: opacity $animate-duration ease-in;
                // border-color:  var(--info);
                border-image-slice: 100% 0%;
            }

             i {
                color: var(--info);
            }
        }

        &.warning {
                & .highlight{
                    // background-image: linear-gradient(var(--warning-banner-bg), var(--body-bg));
                    // border-color:  var(--warning);
                    border-image-slice: 100% 0%;
                }

            .highlight .icon {
                color: var(--warning);
            }
        }
    }

}
</style>
