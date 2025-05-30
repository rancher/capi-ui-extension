<script>
import debounce from 'lodash/debounce';
import { removeAt } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

export default {
  components: { LabeledSelect, LabeledInput },
  emits:      ['add', 'remove', 'update:value'],
  props:      {
    value: {
      type:     Array,
      default:  null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    title: {
      type:     String,
      required: true
    },
    classOptions: {
      type:     Array,
      default:  null,
    },
    addBtnTitle: {
      type:     String,
      default: 'Add'
    },
    addAllowed: {
      type:    Boolean,
      default: true,
    },
    removeAllowed: {
      type:    Boolean,
      default: true,
    },
    defaultAddValue: {
      type:    [String, Number, Object, Array],
      default: ''
    },
    loading: {
      type:    Boolean,
      default: false
    },
    disabled: {
      type:    Boolean,
      default: false,
    },
    componentTestid: {
      type:    String,
      default: 'worker-item',
    }
  },
  data() {
    const input = (this.value || [])?.slice();
    const rows = [];

    for ( const value of input ) {
      rows.push({ value });
    }
    if ( !rows.length ) {
      const value = this.defaultAddValue ? clone(this.defaultAddValue) : '';

      rows.push({ value });
    }

    return { rows, lastUpdateWasFromValue: false };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    removeLabel() {
      return this.$store.getters['i18n/t']('generic.remove');
    }
  },
  watch:    {
    value: {
      deep: true,
      handler() {
        this.lastUpdateWasFromValue = true;
        this.rows = (this.value || []).map((v) => ({ value: v }));
      }
    },
    rows: {
      deep: true,
      handler() {
        // lastUpdateWasFromValue is used to break a cycle where when rows are updated
        // this was called which then forced rows to updated again
        if (!this.lastUpdateWasFromValue) {
          this.queueUpdate();
        }
        this.lastUpdateWasFromValue = false;
      }
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 50);
  },
  methods: {
    add() {
      this.rows.push({ value: clone(this.defaultAddValue) });
      if (this.defaultAddValue) {
        this.queueUpdate();
      }
      this.$nextTick(() => {
        const inputs = this.$refs.value;

        if ( inputs && inputs.length > 0 ) {
          inputs[inputs.length - 1].focus();
        }
        this.$emit('add');
      });
    },
    /**
     * Remove item and emits removed row and its own index value
     */
    remove(row, index) {
      this.$emit('remove', { row, index });
      removeAt(this.rows, index);
      this.queueUpdate();
    },
    update() {
      if ( this.isView ) {
        return;
      }
      const out = [];

      for ( const row of this.rows ) {
        const value = row.value;

        if ( typeof value !== 'undefined' ) {
          out.push(value);
        }
      }
      this.$emit('update:value', out);
    },
    valUpdate(val, key) {
      key.value.name = val.data;
    }
  }
};
</script>
<template>
  <div class="span-9">
    <div
      v-if="title"
      class="clearfix"
    >
      <slot name="title">
        <h3>
          {{ title }}
        </h3>
      </slot>
    </div>

    <template v-if="rows.length">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        :data-testid="`${componentTestid}-box${ idx }`"
        class="box"
      >
        <div class="value row row-wi">
          <div class="col-long mr-20 span-4 mt-10">
            <LabeledInput
              ref="value"
              v-model:value="row.value.name"
              :mode="mode"
              :disabled="false"
              :label="t('capi.cluster.workers.name')"
              required
            />
          </div>
          <div class="col-long mr-20 span-4 mt-10">
            <LabeledSelect
              v-model:value="row.value.class"
              :mode="mode"
              :options="classOptions"
              label-key="capi.cluster.workers.class"
              required
            />
          </div>
          <div class="col-short mr-10 mt-10">
            <LabeledInput
              :value="row.value.replicas"
              :mode="mode"
              :disabled="false"
              :label="t('capi.cluster.workers.replicas')"
              type="number"
              placeholder="1"
              @update:value="(val) => !!val ? row.value.replicas = parseInt(val) : row.value.replicas = null"
            />
          </div>
          <div
            v-if="removeAllowed"
            class="remove mt-20"
          >
            <button
              type="button"
              :disabled="isView"
              class="btn role-link"
              :data-testid="`${componentTestid}-remove-item-${idx}`"
              @click="remove(row, idx)"
            >
              {{ removeLabel }}
            </button>
          </div>
        </div>
      </div>
    </template>
    <div
      v-else-if="mode==='view'"
      class="text-muted"
    >
      &mdash;
    </div>
    <div v-else>
      <slot name="empty" />
    </div>
    <div
      v-if="addAllowed && !isView"
      class="footer mt-30"
    >
      <slot
        v-if="addAllowed"
        name="add"
        :add="add"
      >
        <button
          type="button"
          class="btn role-tertiary add"
          :disabled="loading"
          :data-testid="`${componentTestid}-button`"
          @click="add()"
        >
          <i
            v-if="loading"
            class="mr-5 icon icon-spinner icon-spin icon-lg"
          />
          {{ addBtnTitle }}
        </button>
      </slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
@media screen and (max-width: 1100px) {
    .row-wi {
        flex-direction: column;
        width: 100%
    }
    .col-long {
        width: 130%
    }
    .col-short {
        width: 50%
    }
}
</style>
