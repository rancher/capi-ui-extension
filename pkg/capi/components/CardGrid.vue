<script>
import { get } from '@shell/utils/object';
import capitalize from 'lodash/capitalize';
import ClusterClassCard from './../components/ClusterClassCard/index';

export default {
  components: { ClusterClassCard },

  props: {
    rows: {
      type:     Array,
      required: true,
    },

    keyField: {
      type:    String,
      default: 'key',
    },

    noDataKey: {
      type:    String,
      default: 'sortableTable.noRows',
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'select-card-grid'
    }
  },

  methods: {
    get,
    select(row, idx) {
      this.$emit('clicked', row, idx);
    },
    capitalize
  },
};
</script>

<template>
  <div
    v-if="rows.length"
    class="grid"
  >
    <div
      v-for="(r, idx) in rows"
      :key="get(r, keyField)"
      class="item"
      :data-testid="componentTestid + '-' + idx"
      @click="select(r, idx)"
    >
      <ClusterClassCard
        :value="r.obj"
      />
    </div>
  </div>
  <div
    v-else
    class="m-50 text-center"
  >
    <h1 v-t="noDataKey" />
  </div>
</template>

<style lang="scss" scoped>
  $height: 135px;
  $side: 15px;
  $margin: 10px;
  $hover-border-width: 1px;
  $width: 50%;

  .grid1 {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .item {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .item {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .item {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .item1 {
        width: calc(25% - 2 * #{$margin});
      }
    }

    $color: var(--body-text) !important;

    .item1 {
      height: $height;
      margin: $margin;
      padding: $margin;
      position: relative;
      //border-radius: calc( 1.5 * var(--border-radius));
      border: 1px solid var(--border);
      text-decoration: none !important;
      color: $color;

      &:hover:not(.disabled) {
        box-shadow: 0 0 30px var(--shadow);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
        text-decoration: none !important;
      }

      .side-label {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 2px 5px;

        &.indicator {
          top: 0;
          right: 0;
          left: 0;
        }

      }

      .side-label label, label.deploys-os-label, label.os-incompatible-label{
          font-size: 12px;
          line-height: 12px;
          text-align: center;
          display: block;
          white-space: no-wrap;
          text-overflow: ellipsis;
          // Override default form label properties
          color: var(--card-badge-text);
          margin: 0;
      }

      .deploys-os-label, .os-incompatible-label {
        position: absolute;
        bottom: 10px;
        padding: 2px 5px;
        right: 10px;
      }

      label.os-incompatible-label {
        color: var(--warning);
        background-color: var(--warning-banner-bg)
      }

      &.rancher {
        .side-label, .deploys-os-label {
          background-color: var(--app-rancher-accent);
          label {
            color: var(--app-rancher-accent-text);
          }
        }
        &:hover:not(.disabled) {
          border-color: var(--app-rancher-accent);
        }
      }

      &.partner {
        .side-label, .deploys-os-label {
          background-color: var(--app-partner-accent);
          label {
            color: var(--app-partner-accent-text);
          }
        }
        &:hover:not(.disabled) {
          border-color: var(--app-partner-accent);
        }
      }

      // @TODO figure out how to templatize these
      &.color1 {
        .side-label, .deploys-os-label { background-color: var(--app-color1-accent); label { color: var(--app-color1-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color1-accent); }
      }
      &.color2 {
        .side-label, .deploys-os-label { background-color: var(--app-color2-accent); label { color: var(--app-color2-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color2-accent); }
      }
      &.color3 {
        .side-label, .deploys-os-label { background-color: var(--app-color3-accent); label { color: var(--app-color3-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color3-accent); }
      }
      &.color4 {
        .side-label, .deploys-os-label { background-color: var(--app-color4-accent); label { color: var(--app-color4-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color4-accent); }
      }
      &.color5 {
        .side-label, .deploys-os-label { background-color: var(--app-color5-accent); label { color: var(--app-color5-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color5-accent); }
      }
      &.color6 {
        .side-label, .deploys-os-label { background-color: var(--app-color6-accent); label { color: var(--app-color6-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color6-accent); }
      }
      &.color7 {
        .side-label, .deploys-os-label { background-color: var(--app-color7-accent); label { color: var(--app-color7-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color7-accent); }
      }
      &.color8 {
        .side-label, .deploys-os-label { background-color: var(--app-color8-accent); label { color: var(--app-color8-accent-text); } }
        &:hover:not(.disabled) { border-color: var(--app-color8-accent); }
      }

      &.has-description {
        .name {
          margin-top: $margin;
          line-height: initial;
        }

        &.has-side-label {
          .name {
            margin-top: $margin + 5px;
          }
        }
      }
    }

  }
</style>
