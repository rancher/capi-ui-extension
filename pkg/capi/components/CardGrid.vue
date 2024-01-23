<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import { get } from '@shell/utils/object';
import capitalize from 'lodash/capitalize';
import ClusterClassCard from './../components/ClusterClassCard/index.vue';

interface Card { //TODO check all of these are needed
  id: String,
  obj: Object,
  label: String,
  description: String,
  disabled: Boolean,
  tag: String,
  selected: Boolean
}

export default defineComponent({
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
      class="item"
      :class="{selected: !!r.selected}"
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
  $height: 300px;
  $side: 15px;
  $margin: 10px;
  $hover-border-width: 1px;
  $width: 40%;//600px;
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
      grid-template-columns: 1fr;
    }
  }
  .item {
      &:hover {
        box-shadow: 0 0 30px var(--shadow);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
        text-decoration: none !important;
      }
      &.selected {
        border: 2px solid var(--app-color3-accent);
      }
      &:active {
        border: 2px solid var(--app-color3-accent);
      }

    }
</style>
