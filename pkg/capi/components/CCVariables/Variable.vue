<script lang="ts">
import { defineComponent } from 'vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue';
import ArrayList from '@shell/components/form/ArrayList';

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

  computed: {
    componentForType() {
      const { type } = this.schema;
      let out = null;

      // if the schema has valid options defined, use a different input:
      // <=3 options: radio group
      // >3 options: labeled select
      // options are array or object: //TODO nb fuck
      if (this.variableOptions) {
        if (this.variableOptions.length <= 3) {
          out = RadioGroup;
        }
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
    }
  },

});
</script>

<template>
  <component
    :is="componentForType"
    v-if="componentForType"
    :value="value"
    :label="variable.name"
    :placeholder="schema.example"
    :tooltip="schema.description"
    :required="variable.required"
    :title="variable.name"
    @input="e=>$emit('input', e)"
  />
</template>
