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
    isDeployments: {
      type:    Boolean,
      default: true
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
    defaultAddValue: {
      type:    Object,
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
    },

    globalVariables: {
      type:    Array,
      default: () => []
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

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    removeLabel() {
      return this.$store.getters['i18n/t']('generic.remove');
    },

    addLabel() {
      return this.isDeployments ? this.t('capi.cluster.workers.machineDeployments.add') : this.t('capi.cluster.workers.machinePools.add');
    },

    machineClassType() {
      return this.isDeployments ? 'machineDeploymentClass' : 'machinePoolClass';
    },
    title() {
      return this.isDeployments ? this.t('capi.cluster.workers.machineDeployments.title') : this.t('capi.cluster.workers.machinePools.title');
    },

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
    },

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

      return this.$nextTick(() => {
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
    },

  }
};
</script>
<template>
  <div class="span-12">
    <div
      v-if="title"
      class="clearfix"
    >
      <div
        v-if=" !isView"
        class="footer mt-20"
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
      </div>
    </div>

    <template v-if="rows.length">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        :data-testid="`${componentTestid}-box${ idx }`"
        class="box"
      >
        <div class="value row row-wi">
          <div class="col-long span-5">
            <LabeledSelect
              v-model:value="row.value.class"
              :mode="mode"
              :options="classOptions"
              label-key="capi.cluster.workers.class"
              required
            />
          </div>
          <div
            v-if="row.value.class"
            class="col-long  span-5"
          >
            <LabeledInput
              ref="value"
              v-model:value="row.value.name"
              :mode="mode"
              :disabled="false"
              :label="t('capi.cluster.workers.name')"
              required
            />
          </div>
          <div class="col-short mr-10    span-2">
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
            v-show="rows.length > 1"
            class="remove"
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

        <div
          v-if="row.value.class"
          class="machine-variables"
        >
          <CCVariables
            v-model:value="row.value.variables.overrides"
            :global-variables="globalVariables"
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
    <div v-else>
    </div>
  </div>
</template>
<style lang="scss" scoped>
@media screen and (max-width: 1000px) {
  .row-wi {
      flex-direction: column;
      width: 100%;
  }
  .box .row-wi.value.row>.col-long {
      width: 100%;
      margin-top: 20px;
  }
  .box .row-wi.value.row>.col-short {
      width: 100%;
      margin-top: 20px;
  }
}

.box {
    margin: 40px 0px 40px 0px;

    &>.value.row .col-long{
      width: 25%;
      margin-right: 1.12%;
    }

    & .remove{
      align-content: center;
    }
}
</style>
