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

  emits:      ['remove', 'update:value'],

  props:      {
    value: {
      type:     Array,
      default:  null,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    classOptions: {
      type:     Array,
      default:  null,
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

  created() {
    this.queueUpdate = debounce(this.update, 50);
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    // TODO nb prop
    isDeployments() {
      return this.title.includes('Deployments');
    },

    removeLabel() {
      return this.$store.getters['i18n/t']('generic.remove');
    },

    machineClassType() {
      return this.isDeployments ? 'machineDeploymentClass' : 'machinePoolClass';
    },

  },

  methods: {
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
  <div class="row ">
    <template v-if="rows.length">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        :data-testid="`array-list-box${ idx }`"
        class="col span-12 box"
      >
        <div
          class="remove mt-30"
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
          <div class="col-short mr-10 mt-20">
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
          <div class="col-long mr-20 span-4 mt-20">
            <LabeledSelect
              v-model:value="row.value.class"
              :mode="mode"
              :options="classOptions"
              label-key="capi.cluster.workers.class"
              required
            />
          </div>
          <div
            v-if="needsName(row) && row.value.class"
            class="col-long mr-20 span-4 mt-20"
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
