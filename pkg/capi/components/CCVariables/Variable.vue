<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { Validator } from '@shell/utils/validators/formRules';

import { mapGetters } from 'vuex';
import { Translation } from '@rancher/shell/types/t';
import type { ClusterClassVariable } from '../../types/clusterClass';
import { isDefined, openAPIV3SchemaValidators } from '../../util/validators';
export default Vue.extend({
  name: 'CCVariable',

  props: {
    variable: {
      type:     Object as PropType<ClusterClassVariable>,
      required: true
    },

    value: {
      type:    [String, Object, Boolean, Array, Number],
      default: () => null
    },

    validateRequired: {
      type:    Boolean,
      default: true
    }
  },

  watch: {
    isValid(neu) {
      this.$emit('validation-passed', neu);
    }
  },

  created() {
    if (!this.isValid) {
      this.$emit('validation-passed', false);
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    componentForType(): {component: any, name: string} | undefined {
      const { type } = this.schema;
      let out: any;

      if (this.variableOptions) {
        out = { component: LabeledSelect, name: 'text-var' };
      } else {
        switch (type) {
        case 'object':
          out = { component: KeyValue, name: 'keyvalue-var' };
          break;
        case 'array':
          out = { component: ArrayList, name: 'arraylist-var' };
          break;
        case 'string':
          out = { component: LabeledInput, name: 'text-var' };
          break;
        case 'integer':
          out = { component: LabeledInput, name: 'text-var' };

          break;
        case 'number':
          out = { component: LabeledInput, name: 'text-var' };

          break;
        case 'boolean':
          out = { component: Checkbox, name: 'checkbox-var' };

          break;
        default:
          break;
        }
      }

      return out;
    },

    schema() {
      return this.variable?.schema?.openAPIV3Schema;
    },

    // options may be arrays or objects - stringify them to display in labeledselect
    variableOptions() {
      const opts = this.schema?.enum;

      if (!opts || !opts.length) {
        return null;
      }

      return opts.map((opt: any) => {
        return typeof opt === 'object' ? JSON.stringify(opt) : opt;
      });
    },

    validationRules() {
      const t = this.t as Translation;
      const out = openAPIV3SchemaValidators(t, { key: this.variable.name }, this.schema);

      const required = this.variable?.required;

      if (required && this.validateRequired) {
        out.push((val: any) => !isDefined(val) ? t('validation.required', { key: this.variable.name }) : undefined);
      }

      return out;
    },

    isValid() {
      return !this.validationErrors.length;
    },

    validationErrors() {
      return this.validationRules.reduce((errs: string[], rule: Validator) => {
        const message = rule(this.value);

        if (message) {
          errs.push(message);
        }

        return errs;
      }, []);
    },

    listComponent() {
      return this.componentForType?.name === 'arraylist-var' || this.componentForType?.name === 'keyvalue-var';
    }
  },

  methods: {
    setValue(e: any) {
      let out = e;

      const { type } = this.schema;

      if (type === 'object') {
        try {
          out = JSON.parse(e);
        } catch {}
      }
      this.$emit('input', out);
    }
  },
});
</script>

<template>
  <div v-if="componentForType" :class="{'wider': listComponent, 'align-center': componentForType?.name==='checkbox-var', [`${componentForType.name}`]: true}">
    <component
      :is="componentForType.component"
      v-if="componentForType"
      :value="value"
      :label="variable.name"
      :placeholder="schema.example"
      :tooltip="schema.description"
      :required="variable.required && validateRequired"
      :title="variable.name"
      :options="variableOptions"
      :rules="!listComponent ? validationRules : []"
      :type="schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'"
      @input="setValue"
    >
      <template #title>
        <div class="input-label">
          <span>{{ variable.name }}
            <i v-if="schema.description" v-clean-tooltip="schema.description" class="icon icon-sm icon-info" />
            <i v-if="!isValid" v-clean-tooltip="validationErrors.join(' ')" class="icon icon-warning" />
          </span>
        </div>
      </template>
    </component>
    <div class="flexbox-newline" />
  </div>
</template>
<style lang="scss" scoped>
.align-center {
  align-self: 'center'
}
.input-label{
  color: var(--input-label);
  margin-bottom: 5px;
  display: block;
  width:100%;
  .icon-warning{
    color: var(--error)
  }
}
</style>
