<script>
import isEqual from 'lodash/isEqual';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

import { mapGetters } from 'vuex';
import { isDefined, openAPIV3SchemaValidators } from '../../util/validators';

export default {
  name:  'CCVariable',
  emits: ['validation-passed', 'update:value'],
  props: {
    variable: {
      type:     Object,
      required: true
    },

    value: {
      type:    [String, Object, Boolean, Array, Number],
      default: () => null
    },

    validateRequired: {
      type:    Boolean,
      default: true
    },

    allVariables: {
      type:    Array,
      default: () => []
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

    componentForType() {
      const { type } = this.schema;
      let out;

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

      return opts.map((opt) => {
        return typeof opt === 'object' ? JSON.stringify(opt) : opt;
      });
    },

    validationRules() {
      if (this.isDefaultValue) {
        return [];
      }
      const t = this.t;
      const out = openAPIV3SchemaValidators(t, { key: this.variable.name }, this.schema);

      const required = this.variable?.required;

      if (required && this.validateRequired) {
        out.push((val) => !isDefined(val) ? t('validation.required', { key: this.variable.name }) : undefined);
      }

      return out;
    },

    isDefaultValue() {
      const defaulVal = this.schema.default;

      if (defaulVal !== undefined) {
        return isEqual(defaulVal, this.value);
      }

      return false;
    },

    isValid() {
      return !this.validationErrors.length;
    },

    validationErrors() {
      return this.validationRules.reduce((errs, rule) => {
        const message = rule(this.value);

        if (message) {
          errs.push(message);
        }

        return errs;
      }, []);
    },

    listComponent() {
      return this.componentForType?.name === 'arraylist-var' || this.componentForType?.name === 'keyvalue-var';
    },

    // if variable def has a toggled-by  label, check allVariables for the toggle's state and show/hide this variable accordingly
    toggled() {
      const toggleLabel = this.variable?.metadata?.labels?.['turtles-capi.cattle.io/toggled-by'];

      const toggleVariable = this.allVariables.find((v) => v.name === toggleLabel);

      if (toggleVariable) {
        return !!toggleVariable.value;
      }

      return true;
    },
  },

  methods: {
    setValue(e) {
      let out = e;

      const { type } = this.schema;

      if (type === 'object') {
        try {
          out = JSON.parse(e);
        } catch {}
      }
      this.$emit('update:value', out);
    }
  },
};
</script>

<template>
  <div
    v-if="componentForType"
    v-show="toggled"
    :class="{'wider': listComponent, 'align-center': componentForType?.name==='checkbox-var', [`${componentForType.name}`]: true}"
  >
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
      @update:value="setValue"
    >
      <template #title>
        <div class="input-label">
          <span>{{ variable.name }}
            <i
              v-if="schema.description"
              v-clean-tooltip="schema.description"
              class="icon icon-sm icon-info"
            />
            <i
              v-if="!isValid"
              v-clean-tooltip="validationErrors.join(' ')"
              class="icon icon-warning"
            />
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
