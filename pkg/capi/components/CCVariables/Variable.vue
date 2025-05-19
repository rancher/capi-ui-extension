<script>
import isEqual from 'lodash/isEqual';
import jsyaml from 'js-yaml';

import YamlEditor from '@shell/components/YamlEditor';
import { mapGetters } from 'vuex';
import { isDefined, openAPIV3SchemaValidators } from '../../util/validators';
import { componentForType, makeYamlPlaceholders, VARIABLE_INPUT_NAMES } from '../../util/clusterclass-variables';
import { ANNOTATIONS } from '../../types/capi';

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

    //  if the component is being used in a machine pool use the global variable value as placeholder
    // and do not validate required fields (the field will be validated as required at global level)
    isMachineScoped: {
      type:    Boolean,
      default: false
    },

    // the full set of variables that this component is one of
    // either cluster-level variables or one machine pool's available variable overrides
    allVariables: {
      type:    Array,
      default: () => []
    },

    // cluster-level variables
    globalVariables: {
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
      return componentForType(this.schema, this.variable.name);
    },

    schema() {
      return this.variable?.schema?.openAPIV3Schema;
    },

    // options may be arrays or objects - stringify them to display in labeledselect
    // TODO nb  add a placeholder to handle none opts eg cluster class may have '' as one of the enum values
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

      if (required && !this.isMachineScoped) {
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
      return this.componentForType?.name === VARIABLE_INPUT_NAMES.ARRAY || this.componentForType?.name === VARIABLE_INPUT_NAMES.MAP || this.componentForType?.name === VARIABLE_INPUT_NAMES.MAP_YAML;
    },

    isYamlComponent() {
      return this.componentForType?.name === VARIABLE_INPUT_NAMES.YAML;
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

      }

      return '';
    },

    // if mahcine variable, use global value as placeholder
    // otherwise use cluster class's variable definition
    placeholder() {
      if (this.isMachineScoped) {
        const globvalValue = this.globalVariables.find((v) => v.name === this.variable.name)?.value;

        if (globvalValue) {
          return globvalValue;
        }
      }

      return this.schema.example;
    },

    // if variable def has a toggled-by  label, check allVariables for the toggle's state and show/hide this variable accordingly
    toggled() {
      const toggleLabel = this.variable?.metadata?.annotations?.['turtles-capi.cattle.io/toggled-by'];
      const toggleVariable = (this.allVariables || []).find((v) => v.name === toggleLabel);

      if (toggleVariable) {
        return !!toggleVariable.value;
      }

      return !toggleLabel;
    },

    label() {
      return this.variable?.metadata?.annotations?.[ANNOTATIONS.LABEL] || this.variable.name;
    }

  },

  methods: {
    setYamlMapValue(e, row, queueUpdate) {
      try {
        const out = jsyaml.load(e);

        row.value = out;
        queueUpdate();
      } catch (err) {

      }
    },
    setValue(e) {
      let out = e;

      if (this.isYamlComponent) {
        try {
          out = jsyaml.load(e);
        } catch (err) {
          // the yamleditor component will show an error icon if the user has entered invalid yaml + focuses away
        }
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
    :class="{'wider': isListComponent, 'widest': isYamlKeyValueComponent || isYamlComponent, 'align-center': componentForType?.name==='checkbox-var', [`${componentForType.name}`]: true}"
  >
    <label
      v-if="isYamlComponent"
      :for="componentForType.name"
      class="text-label"
    >
      {{ variable.name }}
      <span
        v-if="variable.required"
        class="text-error"
      >*</span>
    </label>
    <component
      :is="componentForType.component"
      v-if="componentForType"
      :id="componentForType.name"
      :value="isYamlComponent ? yamlPlaceholder || value : value"
      :label="label"
      :on-label="label"
      :placeholder="placeholder"
      :tooltip="schema.description"
      :required="variable.required && !isMachineScoped"
      :title="variable.name"
      :options="variableOptions"
      :rules="!isListComponent ? validationRules : []"
      :type="schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'"
      :as-map="true"
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
          @update:value="e=>setYamlMapValue(e, row, queueUpdate)"
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
