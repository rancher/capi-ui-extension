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
import { openAPIV3SchemaValidators } from '../../util/validators';

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
        out = { component: LabeledSelect, name: 'LabeledSelect' };
      } else {
        switch (type) {
        case 'object':
          out = { component: KeyValue, name: 'KeyValue' };
          break;
        case 'array':
          out = { component: ArrayList, name: 'ArrayList' };
          break;
        case 'string':
          out = { component: LabeledInput, name: 'LabeledInput' };
          break;
        case 'integer':
          out = { component: LabeledInput, name: 'LabeledInput' };

          break;
        case 'number':
          out = { component: LabeledInput, name: 'LabeledInput' };

          break;
        case 'boolean':
          out = { component: Checkbox, name: 'Checkbox' };

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
    },

    widerComponent() {
      return this.componentForType?.name === 'ArrayList' || this.componentForType?.name === 'KeyValue';
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
  <div :class="{'wider': widerComponent, 'align-center': componentForType?.name==='Checkbox'}">
    <component
      :is="componentForType.component"
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
      :type="schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'"
      @input="setValue"
    />
  </div>
</template>
<style lang="scss" scoped>
.align-center {
  align-self: 'center'
}
</style>