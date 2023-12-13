<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue';
import ArrayList from '@shell/components/form/ArrayList';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import formRulesGenerator, { Validator } from '@shell/utils/validators/formRules';

import type { ClusterClassVariable } from '../../types/clusterClass';
import openAPIV3SchemaValidators from '../../util/validators';

// object, array, string, integer, number or boolean.

export default defineComponent({
  name: 'CCVariable',

  props: {
    variable: {
      type:     Object as PropType<ClusterClassVariable>,
      required: true
    },
    value: {
      type:    [String, Object, Boolean, Array, Number],
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

    componentWidths() {
      return {
        LabeledSelect: 'span-3',
        LabeledInput:  'span-3',
        Checkbox:      'span-3',
        ArrayList:     'span-6'
      };
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

    isMultiSelect() {
      return this.componentForType === LabeledSelect && this.schema.type === 'array' && typeof this.variableOptions?.[0] !== 'object';
    },

    validationRules() {
      const out = openAPIV3SchemaValidators(this.$store.getters['i18n/t'], { key: this.variable.name }, this.schema);

      const required = this.variable?.required;

      if (required) {
        out.push(formRulesGenerator(this.$store.getters['i18n/t'], { key: this.variable.name }).required as Validator);
      }

      return out;
    },

    isValid() {
      return !this.validationRules.find((rule: Validator) => !!rule(this.value));
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
  <div>
    <component
      :is="componentForType"
      v-if="componentForType"
      :value="value"
      :label="variable.name"
      :placeholder="schema.example"
      :tooltip="schema.description"
      :required="variable.required"
      :title="variable.name"
      :options="variableOptions"
      :multiple="isMultiSelect"
      :rules="validationRules"
      @input="setValue"
    />
  </div>
</template>
