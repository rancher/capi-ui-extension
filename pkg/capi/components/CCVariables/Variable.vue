<script>
import isEqual from 'lodash/isEqual';
import jsyaml from 'js-yaml';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import YamlEditor from '@shell/components/YamlEditor';
import { createYaml, saferDump } from '@shell/utils/create-yaml';
import { mapGetters } from 'vuex';
import { isDefined, openAPIV3SchemaValidators } from '../../util/validators';

export default {
  name: 'CCVariable',

  emits: ['validation-passed', 'update:value'],

  components: { YamlEditor },

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
          if (this.schema?.items?.type === 'string') {
            out = { component: ArrayList, name: 'arraylist-var' };
          } else {
            // out = { component: ArrayList, name: 'yamleditor-var' };
            out = { component: YamlEditor, name: 'yamleditor-var' };
          }
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

    isListComponent() {
      return this.componentForType?.name === 'arraylist-var' || this.componentForType?.name === 'keyvalue-var';
    },

    isYamlComponent() {
      return this.componentForType?.name === 'yamleditor-var';
    },

    // TODO nb use createYaml function to generate commented-out placeholders
    yamlPlaceholder() {
      if (!this.isYamlComponent) {
        return;
      }
      console.log('*** generating yaml...');
      const { schema } = this;
      const mockSchema = { id: 'ccvariable', resourceFields: { subnets: { type: 'array', subtype: 'ccvariable-sub' } } };
      const mockSchemaSub = { id: 'ccvariable-sub', resourceFields: schema?.items?.properties };

      let out;

      try {
        out = createYaml([mockSchema, mockSchemaSub], 'ccvariable', {}, false);
      } catch (err) {
        console.error(err);
      }
      const sliced = out.slice(out.indexOf('\n') + 1);

      console.log('*** yaml sliced: ', sliced);

      return sliced;
    },

  },

  methods: {
    setValue(e) {
      let out = e;

      if (this.isYamlComponent) {
        try {
          out = jsyaml.load(e);
        } catch (err) {
          // we can fail silently here; the yamleditor component will show an error icon if the user has entered invalid yaml
        }
      }

      console.log('*** variable component updating value to ', out);
      this.$emit('update:value', out);
    }
  },
};
</script>

<template>
  <div
    v-if="componentForType"
    :class="{'wider': isListComponent || isYamlComponent, 'align-center': componentForType?.name==='checkbox-var', [`${componentForType.name}`]: true}"
  >
    <component
      :is="componentForType.component"
      v-if="componentForType"
      :value="yamlPlaceholder || value"
      :label="variable.name"
      :placeholder="schema.example"
      :tooltip="schema.description"
      :required="variable.required && validateRequired"
      :title="variable.name"
      :options="variableOptions"
      :rules="!isListComponent ? validationRules : []"
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
      <!-- <template
        v-if="isYamlComponent"
        #value="{queueUpdate}"
      >
        <YamlEditor
          :value="yamlPlaceholder"
          :required="variable.required && validateRequired"
          @update:value="queueUpdate"
        />
      </template> -->
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
