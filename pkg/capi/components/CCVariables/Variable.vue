<script>
import isEqual from 'lodash/isEqual';
import jsyaml from 'js-yaml';

import YamlEditor from '@shell/components/YamlEditor';
import { mapGetters } from 'vuex';
import { isDefined, openAPIV3SchemaValidators } from '../../util/validators';
import { componentForType, isToggle, makeYamlPlaceholders, VARIABLE_INPUT_NAMES } from '../../util/clusterclass-variables';
import { ANNOTATIONS } from '../../types/capi';
import VariableHighlight from './VariableHighlight.vue';
import { _CREATE } from '@shell/config/query-params';

// how many indentation levels the ui will display
const MAX_DEPTH = 2;

export default {
  name:  'CCVariable',
  // error is emitted when an error occurs parsing or generating yaml. validation-passed corresponds to validation defined in the clusterclass spec
  emits: ['validation-passed', 'update:value', 'error'],

  components: { YamlEditor, VariableHighlight },

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
    },

    // show/hide all info boxes
    willOpen: {
      type:    Boolean,
      default: true
    },

    // all variable definitions in this section
    allDefinitions: {
      type:    Array,
      default: () => []
    },

    clusterNamespace: {
      type:    String,
      default: ''
    },

    mode: {
      type:    String,
      default: _CREATE
    },

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

    if (this.isYamlComponent || this.isYamlKeyValueComponent) {
      this.yamlPlaceholder = this.generateYamlPlaceholder();
    }
  },

  data() {
    return {
      noneOption: this.t('capi.cluster.variables.emptyStringOption'), annotationError: '', yamlPlaceholder: ''
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t', withFallback: 'i18n/withFallback' }),

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
        let out = typeof opt === 'object' ? JSON.stringify(opt) : opt;

        if (opt === '') {
          out = this.noneOption;
        }

        return out;
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

    /**
     * Computed props about which input component to show
     */

    componentForType() {
      return componentForType(this.variable, this.allDefinitions);
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

    /**
     * Compute how to display variable
     * 2-per-row or full row
     * how far indented
     */

    displayClasses() {
      const out = {
        wider:  this.isListComponent,
        widest: this.isYamlKeyValueComponent || this.isYamlComponent || this.highlighted || this.isSearchComponent,
        center: this.componentForType.name === VARIABLE_INPUT_NAMES.BOOL || this.componentForType.name === VARIABLE_INPUT_NAMES.BOOL_TOGGLE
      };

      const toggleLabels = (this.variable?.metadata?.annotations?.[ANNOTATIONS.TOGGLED_BY] || '').split(',').map((n) => n.replace(' ', ''));
      const toggleDepth = (this.allVariables || []).filter((v) => toggleLabels.includes(v.name))?.length;

      if (toggleDepth <= MAX_DEPTH) {
        out.depth = `depth-${ toggleDepth }`;
      } else {
        out.depth = `depth-max`;
      }

      return out;
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
      try {
        const toggleLabels = (this.variable?.metadata?.annotations?.[ANNOTATIONS.TOGGLED_BY] || '').split(',').map((n) => n.replace(' ', ''));
        const toggleVariables = (this.allVariables || []).filter((v) => toggleLabels.includes(v.name));

        if (toggleVariables && toggleVariables.length) {
          const toggleFalse = !!toggleVariables.find((v) => !v.value);

          return !toggleFalse;
        }

        return true;
      } catch (err) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.annotationError = (this.t('error.parseVariableAnnotation', { variable: this.withFallback(`capi.variables.${ this.label }`, null, this.label), annotation: ANNOTATIONS.TOGGLED_BY }));

        return true;
      }
    },

    // does this variable toggle others in the section
    isToggle() {
      return isToggle(this.variable, this.allDefinitions);
    },

    label() {
      return this.variable?.metadata?.annotations?.[ANNOTATIONS.LABEL] || this.variable.name;
    },

    highlighted() {
      return !!this.variable?.metadata?.annotations?.[ANNOTATIONS.HIGHLIGHT] && !this.isMachineScoped;
    },

    isSearchComponent() {
      return this.componentForType.name === VARIABLE_INPUT_NAMES.SEARCH_TYPE;
    },

    resourceType() {
      return this.variable?.metadata?.annotations?.[ANNOTATIONS.SEARCH_TYPE];
    },

    displayValue() {
      if (this.isYamlComponent) {
        return this.yamlPlaceholder || this.value;
      }
      if (this.variableOptions?.length && this.value === '') {
        return this.noneOption;
      }

      return this.value;
    },

    // use description in tooltip if the description isn't being used in a highlight.
    // If there was an error parsing the variables annotations, include that in the tooltip
    // and show  a warning icon
    tooltip() {
      let out = '';

      if (!this.highlighted) {
        out += this.schema.description;
      }

      if (this.annotationError) {
        out += this.annotationError;
      }

      return out;
    }

  },

  methods: {
    setYamlMapValue(e, row, queueUpdate) {
      try {
        const out = jsyaml.load(e);

        row.value = out;
        queueUpdate();
      } catch (err) {
        const msg = this.t('error.yamlParseError', { variable: this.variable.name }) + err;

        this.$emit('error', msg);
      }
    },
    setValue(e, toggleOpen) {
      let out = e;

      if (this.isYamlComponent) {
        try {
          out = jsyaml.load(e);
        } catch (err) {
          // the yamleditor component will show an error icon if the user has entered invalid yaml + focuses away
        }
      }
      if (this.isToggle) {
        // open the info highlight when toggle switch is enabled
        toggleOpen(e);
      }

      if (this.variableOptions?.length && e === this.noneOption) {
        out = '';
      }

      this.$emit('update:value', out);
    },

    generateYamlPlaceholder() {
      if (!this.isYamlComponent && !this.isYamlKeyValueComponent) {
        return;
      }

      try {
        const out = makeYamlPlaceholders(this.schema);

        return out || '';
      } catch (err) {
        const msg = this.t('error.yamlPlaceholderError', { variable: this.variable.name }) + err;

        this.$emit('error', msg);
      }

      return '';
    },
  },

};
</script>

<template>
  <div
    v-if="componentForType"
    v-show="toggled"
    :class="{'wider': displayClasses.wider,
             'widest': displayClasses.widest,
             'align-center': displayClasses.center,
             [`${componentForType.name}`]: true,
             [`${displayClasses.depth}`]: true
    }"
  >
    <VariableHighlight
      :is-machine-scoped="isMachineScoped"
      :mode="mode"
      :variable-def="variable"
      :variable-value="value"
      :will-open="willOpen"
      :is-toggle="isToggle"
    >
      <template #highlight="{toggleOpen}">
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
          :mode="mode"
          :aria-label="withFallback(`capi.variables.${label}`, null, label)"
          :value="displayValue"
          :label="!highlighted ? withFallback(`capi.variables.${label}`, null, label) : ' '"
          :on-label="isToggle ? withFallback(`capi.variables.${label}`, null, label) : undefined"

          :placeholder="placeholder"
          :tooltip="tooltip"
          :status="annotationError ? 'warning' : null"
          :required="variable.required && !isMachineScoped && !highlighted"
          :title="!highlighted ? withFallback(`capi.variables.${label}`, null, label) : ' '"
          :options="variableOptions"
          :rules="!isListComponent ? validationRules : []"
          :type="schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'"
          :as-map="true"
          :resource-type="resourceType"
          :cluster-namespace="clusterNamespace"

          @update:value="e=>setValue(e, toggleOpen)"
        >
          <template #title>
            <div v-if="highlighted">
              <span />
            </div>
            <div
              v-else
              class="input-label"
            >
              <span>{{ withFallback(`capi.variables.${label}`, null, label) || ' ' }}
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
      </template>
    </VariableHighlight>
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
