<script>
import debounce from 'lodash/debounce';
import { removeAt } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import CCVariables from '../../../components/CCVariables/index.vue';
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

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    isDeployments() {
      return this.title.includes('Deployments');
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

  },

  methods: {
    add() {
      this.rows.push({ value: clone(this.defaultAddValue) });
      if (this.defaultAddValue) {
        this.queueUpdate();
      }

      return this.$nextTick(() => {
        const inputs = this.$refs.value;

        // if ( inputs && inputs.length > 0 ) {
        //   inputs[inputs.length - 1].focus();
        // }
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

    needsName(row) {
      const definitions = this.isDeployments ? this.clusterClass.spec.workers.machineDeployments : this.clusterClass.spec.workers.machinePools;

      return !(definitions || []).find((d) => d.class === row.value.class)?.namingStrategy;
    },

    expanded(row) {

    }

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
      <!-- // workeritem componernt -->
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
        width: 100%
    }
    .col-long {
        width: 130%
    }
    .col-short {
        width: 50%
    }
}

.machine-variables {
  margin: 0px 16px 16px;
  // :deep() .accordion-container {
  // border-image: linear-gradient( var(--primary-banner-bg), var(--body-bg));
  //  border-image-slice: 1;
  //  border-style: solid;
  // }
}

.box {
  &>.remove {
    border-bottom: 1px solid var(--border);
    & button{
      position: absolute;
      top:-2.5em;
      right: .5em;

    }
  }

  position: relative;
  // border-image: linear-gradient( var(--primary-banner-bg), var(--body-bg));
  //  border-image-slice: 1;
  margin-top: 20px;
  //  border-style: solid;
  padding: 0px 16px 16px;
  // border: 1px solid var(--border);
}
</style>
