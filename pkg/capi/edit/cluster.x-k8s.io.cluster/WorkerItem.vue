<script>
import debounce from 'lodash/debounce';
import { removeAt } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import CCVariables from '../../components/CCVariables/index.vue';

export default {
  components: {
    LabeledSelect, LabeledInput, CCVariables
  },
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

    addAllowed: {
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

    clusterClass: {
      type:    Object,
      default: () => {
        return {};
      }
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
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    removeLabel() {
      return this.$store.getters['i18n/t']('generic.remove');
    },

    addLabel() {
      // return this.$store.getters['i18n/t']('generic.add');
      return 'Add Worker';
    },

    machineClassType() {
      return this.title.includes('Deployments') ? 'machineDeploymentClass' : 'machinePoolClass';
    }
  },
};
</script>
<template>
  <div>
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
        :data-testid="`array-list-box${ idx }`"
        class="box mb-40"
      >
        <div
          class="remove"
        >
          <button
            type="button"
            :disabled="isView"
            class="btn role-link"
            :data-testid="`remove-item-${idx}`"
            @click="remove(row, idx)"
          >
            {{ removeLabel }}
          </button>
        </div>
        <div class="value row mt-40">
          <div
            class="col span-6"
          >
            <LabeledInput
              ref="value"
              v-model:value="row.value.name"
              :mode="mode"
              :disabled="false"
              :label="t('capi.cluster.workers.name')"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="row.value.class"
              :mode="mode"
              :options="classOptions"
              label-key="capi.cluster.workers.class"
            />
          </div>
        </div>

        <div
          v-if="row.value.class"
          class="machine-variables"
        >
          <CCVariables
            v-model:value="row.value.variables.overrides"
            :cluster-class="clusterClass"
            :mode="mode"
            :machine-class-name="row.value.class"
            :machine-class-type="machineClassType"
          />
        </div>
      </div>
    </template>
    <div
      v-else-if="mode==='view'"
      class="text-muted"
    >
      &mdash;
    </div>

    <div
      v-if="addAllowed && !isView"
      class="footer"
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
          data-testid="array-list-button"
          @click="add()"
        >
          <i
            v-if="loading"
            class="mr-5 icon icon-spinner icon-spin icon-lg"
          />
          {{ addLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.box {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 0px 20px 20px 20px;

  .remove {
    float: right;
  }
}
</style>
