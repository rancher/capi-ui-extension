<script lang="ts">
import { defineComponent } from 'vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue';
import ArrayList from '@shell/components/form/ArrayList';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import formRulesGenerator, { Validator } from '@shell/utils/validators/formRules';

import { ClusterClassVariable } from '../../types/clusterClass.ts';

// object, array, string, integer, number or boolean.

export default defineComponent({
  name: 'CCVariable',

  props: {
    variable: {
      type:     ClusterClassVariable,
      required: true
    },
    value: {
      type:    [String, Object, Boolean],
      default: () => null
    }
  },

  watch: {
    isValid(neu) {
      this.$emit('validation-passed', neu);
    }
  },

  computed: {
    componentForType() {
      const { type } = this.schema;
      let out = null;

      // if the schema has valid options defined, use a different input:
      // options are string or integer: labeledselect
      // options are array or object: //TODO nb fuck
      if (this.variableOptions) {
        out = LabeledSelect;
      } else {
        switch (type) {
        case 'object':
          out = KeyValue;
          break;
        case 'array':
          out = ArrayList;
          break;
        case 'string':
          out = LabeledInput;
          break;
        case 'integer':
          out = LabeledInput;
          break;
        case 'number':
          out = LabeledInput;
          break;
        case 'boolean':
          out = Checkbox;
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

    // the schema may define a list of valid options - format them to work correctly in labeledselect
    variableOptions() {
      const opts = this.schema?.enum;

      if (!opts || !opts.length) {
        return null;
      }

      return opts.map((opt: any) => {
        switch (typeof opt) {
        case 'boolean':
          return opt.toString();
        case 'string':
          return opt;
        // todo nb how does labeled select handle numbers?
        case 'number':
          return opt.toString();
        case 'object':
          // TODO nb fuck
          return null;
        }
      });
    },

    isMultiSelect() {
      return this.componentForType === LabeledSelect && this.schema.type === 'array' && typeof this.variableOptions?.[0] !== 'object';
    },

    /**
     * format (string)
     * exclusiveMinimum (integer/number)
     * exclusiveMaximum (integer/number)
     * maxItems (array)
     * maxLength (string)
     * maximum (integer/number)
     * minItems (array)
     * minLength (string)
     * minimum (integer/number)
     * pattern (string)
     * uniqueItems (array)
     * required (object)
     */
    validationRules() {
      const out = [] as any;
      const {
        format,
        exclusiveMinimum,
        exclusiveMaximum,
        maxItems,
        maxLength,
        maximum,
        minItems,
        minLength,
        minimum,
        pattern,
        uniqueItems,
        required: requiredFields
      } = this.schema;

      const required = this.variable?.required;

      if (required) {
        out.push(formRulesGenerator(this.$store.getters['i18n/t'], { key: this.variable.name }).required);
      }

      return out;
    },

    isValid() {
      return !this.validationRules.find((rule: Validator) => !!rule(this.value));
    }
  },

});
</script>

<template>
  <component
    :is="componentForType"
    v-if="componentForType"
    ref="validated-component"
    :value="value"
    :label="variable.name"
    :placeholder="schema.example"
    :tooltip="schema.description"
    :required="variable.required"
    :title="variable.name"
    :options="variableOptions"
    :multiple="isMultiSelect"
    :rules="validationRules"
    @input="e=>$emit('input', e)"
  />
</template>
