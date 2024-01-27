<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import { get } from '@shell/utils/object';
import capitalize from 'lodash/capitalize';
import ClusterClassCard from './../components/ClusterClassCard/index.vue';

interface Card {
  id: String,
  obj: Object,
  selected: Boolean
}

export default Vue.extend({
  components: { ClusterClassCard },
  name:       'CardGrid',

  props: {
    rows: {
      type:     Array as PropType<Card[]>,
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
    select(row: Card[], idx: number) {
      this.resetSelected();
      this.rows[idx].selected = true;
      this.$emit('clicked', row, idx);
    },
    resetSelected() {
      this.rows.map((el) => {
        el.selected = false;
      });
    },
    capitalize
  },
});
</script>

<template>
  <div
    v-if="rows.length"
    class="container"
  >
    <div
      v-for="(r, idx) in rows"
      :key="get(r, keyField)"
      :data-testid="componentTestid + '-' + idx"
      @click="select(r, idx)"
    >
      <ClusterClassCard
        :value="r.obj"
        :selected="r.selected"
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
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
      grid-template-columns: 1fr 1fr;
    }
    @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
      grid-template-columns: 1fr;
    }
  }
</style>
