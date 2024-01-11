<script>
import { get } from '@shell/utils/object';
import capitalize from 'lodash/capitalize';
import ClusterClassCard from './../components/ClusterClassCard/index';

export default {
  components: { ClusterClassCard },

  props: {
    cards: {
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
  computed: {
    rows() {
      return this.cards;
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
  $height: 280px;
  $side: 15px;
  $margin: 10px;
  $hover-border-width: 1px;
  $width: 40%;//600px;
  .item {
      //height: $height;
      //margin: $margin;
      //padding: $margin;
      //position: relative;
      //border-radius: calc( 1.5 * var(--border-radius));
      //border: 1px solid var(--border);
      //text-decoration: none !important;
      width: $width;

      &:hover:not(.disabled) {
        box-shadow: 0 0 30px var(--shadow);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
        text-decoration: none !important;
      }
    }
</style>
