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

        <div class="value row row-wi">
          <!-- TODO nb type number -->
          <div class="col-short mr-10 mt-20">
            <LabeledInput
              :value="row.value.replicas"
              :mode="mode"
              :disabled="false"
              :label="t('capi.cluster.workers.replicas')"
              placeholder="1"
              @update:value="(val) => !!val ? row.value.replicas = parseInt(val) : row.value.replicas = null"
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
          <div
            v-if="row.value.class"
            class="col-long mr-20 span-4 mt-20"
          >
            <LabeledInput
              ref="value"
              v-model:value="row.value.name"
              :mode="mode"
              :disabled="false"
              :label="t('capi.cluster.workers.name')"
              :required="needsName(row)"
            />
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
      width: 100%
  }
  .col-long {
      width: 100%
  }
  .col-short {
      width: 75%
  }
}

.machine-variables {
  margin: 1em  0px 1em 1em;
}

.box {
    // border: 1px solid var(--border);

    margin: 10px 0px 10px 5%;
    padding: 0px 0px 0px 16px;

    // padding-right: 3px;
    // border-right: 3px solid var(--info);
    // background-image: linear-gradient(to left, var(--info-banner-bg), var(--body-bg));
    // transition:    background-image linear-gradient(to left, var(--info-banner-bg)s, var(--body-bg)) 1s;

  &>.remove {
    position: relative;

    & button{
      position: absolute;
      right: .5em;
      top: 2em;
    }
  }
}
</style>
