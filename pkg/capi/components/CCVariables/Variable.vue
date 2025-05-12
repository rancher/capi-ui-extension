<script>
import isEqual from 'lodash/isEqual';
import jsyaml from 'js-yaml';

// import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
// import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
// import KeyValue from '@shell/components/form/KeyValue.vue';
// import ArrayList from '@shell/components/form/ArrayList.vue';
// import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import YamlEditor from '@shell/components/YamlEditor';
import { mapGetters } from 'vuex';
import { isDefined, openAPIV3SchemaValidators } from '../../util/validators';
import { componentForType, makeYamlPlaceholders, SIMPLE_TYPES } from '../../util/clusterclass-variables';

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
      return componentForType(this.schema);
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
      return this.componentForType?.name === 'arraylist-var' || this.componentForType?.name === 'keyvalue-var' || this.componentForType?.name === 'keyvalue-yaml-var';
    },

    isYamlComponent() {
      return this.componentForType?.name === 'yamleditor-var';
    },

    isYamlKeyValueComponent() {
      return this.isListComponent && this.schema?.additionalProperties?.properties;
    },

    yamlPlaceholder() {
      if (!this.isYamlComponent && !this.isYamlKeyValueComponent) {
        return;
      }

      try {
        const out = makeYamlPlaceholders(this.schema);

        return out || '';
      } catch (err) {
        console.error(err);
      }

      return '';
    },

  },

  methods: {
    setValue(e) {
      let out = e;

      if (this.isYamlComponent) {
        try {
          out = jsyaml.load(e);
        } catch (err) {
          // the yamleditor component will show an error icon if the user has entered invalid yaml
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
    :class="{'wider': isListComponent, 'widest': isYamlKeyValueComponent || isYamlComponent, 'align-center': componentForType?.name==='checkbox-var', [`${componentForType.name}`]: true}"
  >
    <label
      v-if="isYamlComponent"
      :for="componentForType.name"
      class="text-label"
    >
      {{ variable.name }}
    </label>
    <component
      :is="componentForType.component"
      v-if="componentForType"
      :id="componentForType.name"
      :value="isYamlComponent ? yamlPlaceholder || value : value"
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
      <template
        v-if="isYamlKeyValueComponent && yamlPlaceholder"
        #value="{queueUpdate, row}"
      >
        <YamlEditor
          :value="yamlPlaceholder || row"
          @update="queueUpdate"
        />
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
