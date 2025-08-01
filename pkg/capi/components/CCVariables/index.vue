<script>
import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';
import Variable from './Variable.vue';
import { componentForType } from '../../util/clusterclass-variables';

export default {
  name: 'ClusterClassVariables',

  components: { Variable },
  // error is emitted when an error occurs parsing or generating yaml. validation-passed corresponds to validation defined in the clusterclass spec
  emits:      ['validation-passed', 'update:value', 'error'],

  props: {
    clusterClass: {
      type:    Object,
      default: () => {}
    },

    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    // if this and machinePoolClass are empty, ALL variables will be shown
    // only 1 of machinePoolClass and machineDeploymentClass should be set
    machineDeploymentClass: {
      type:    String,
      default: null
    },

    machinePoolClass: {
      type:    String,
      default: null
    }
  },

  data() {
    // this key is used on the spacer element so it can be forced to re-calculate its visibility when the cluster class changes
    return { errorCount: 0, rerenderKey: randomStr() };
  },

  watch: {
    errorCount: {
      handler: debounce(function(neu) {
        this.$emit('validation-passed', !neu);
      }, 5),
    },

    variableDefinitions(neu, old) {
      this.updateVariableDefaults(neu, old);
      this.$nextTick(() => {
        this.rerenderKey = randomStr();
      });
    },
  },

  created() {
    this.updateVariableDefaults(this.variableDefinitions, []);
  },

  computed: {
    variableDefinitions() {
      const allVariableDefinitions = this.clusterClass?.spec?.variables || [];

      if (!this.machineDeploymentClass && !this.machinePoolClass) {
        return allVariableDefinitions;
      }
      const variableNames = this.machineScopedJsonPatches.reduce((names, patch) => {
        const valueFromVariable = patch?.valueFrom?.variable;

        if (!valueFromVariable) {
          return names;
        }

        // the value here could be a field or index of the variable, defined <variable definition.name>.<some field> or <variable definition name>[i]
        const parsedName = valueFromVariable.split(/\.|\[/)[0];

        if (parsedName !== 'builtin') {
          names.push(parsedName);
        }

        return names;
      }, []);

      return allVariableDefinitions.filter((v) => variableNames.includes(v.name));
    },

    machineScopedJsonPatches() {
      if (!this.machineDeploymentClass && !this.machinePoolClass) {
        return [];
      }
      const out = [];
      const matchName = this.machineDeploymentClass || this.machinePoolClass;
      const matchKey = this.machineDeploymentClass ? 'machineDeploymentClass' : 'machinePoolClass';

      const patches = this.clusterClass?.spec?.patches || [];

      patches.forEach((p) => {
        const definitions = p?.definitions || [];

        definitions.forEach((definition) => {
          const matchMachines = definition?.selector?.matchResources?.[matchKey]?.names || [];

          if (matchMachines.includes(matchName)) {
            out.push(...definition.jsonPatches);
          }
        });
      });

      return out;
    },

  },

  methods: {
    valueFor(variableDef) {
      return (this.value.find((variable) => variable.name === variableDef.name) || {}).value;
    },

    updateVariables(val, variableDef) {
      const out = [...this.value];
      const existingIdx = this.value.findIndex((variable) => variable.name === variableDef.name);

      if (existingIdx >= 0) {
        out[existingIdx].value = val;
      } else {
        out.push({ value: val, name: variableDef.name });
      }
      this.$emit('update:value', out);
    },

    // update the cluster's variables when the cluster class changes
    updateVariableDefaults(neu, old) {
      // remove or update variables from previous cc
      const out = [...this.value].reduce((acc, existingVar) => {
        const neuDef = (neu || []).find((n) => n.name === existingVar.name);

        // do not include variables not defined in the new cluster class
        if (!neuDef) {
          return acc;
        }
        const oldDefault = (old || []).find((d) => d.name === existingVar.name)?.schema?.openAPIV3Schema?.default;

        // if a variable is set to the previous definition's default, clear it out
        if (oldDefault !== undefined && existingVar.value === oldDefault) {
          delete existingVar.value;
        }
        let newDefault = neuDef.schema?.openAPIV3Schema?.default;

        // leaving boolean values undefined causes confusing form validation behaviour if the boolean is marked as required
        // if the default value isn't set for a boolean, assume the default is false
        if (neuDef.schema?.openAPIV3Schema?.type === 'boolean' && !newDefault) {
          newDefault = false;
        }

        // if the value hasn't been touched by the user set it to the new cc default
        if (newDefault !== undefined && !existingVar.value) {
          existingVar.value = newDefault;
        }
        acc.push(existingVar);

        return acc;
      }, []);

      // add variables not defined in the old cluster class
      neu.forEach((def) => {
        let newDefault = def.schema?.openAPIV3Schema?.default;

        if (def.schema?.openAPIV3Schema?.type === 'boolean' && !newDefault) {
          newDefault = false;
        }
        if (newDefault !== undefined && !out.find((v) => v.name === def.name)) {
          out.push({ name: def.name, value: newDefault });
        }
      });

      this.errorCount = 0;
      this.$emit('update:value', out);
    },

    updateErrors(isValid) {
      if (!isValid) {
        this.errorCount++;
      } else {
        this.errorCount--;
      }
    },

    newComponentType(variableDef, i) {
      const nextVariableDef = this.variableDefinitions[i + 1];

      if (nextVariableDef) {
        return componentForType(variableDef?.schema?.openAPIV3Schema)?.name !== componentForType(nextVariableDef?.schema?.openAPIV3Schema)?.name;
      }
    }
  },

};
</script>

<template>
  <div class="variables">
    <template v-if="variableDefinitions && variableDefinitions.length">
      <template
        v-for="(variableDef, i) in variableDefinitions"
        :key="`${variableDef.name}`"
      >
        <Variable
          :ref="`${variableDef.name}-input`"
          :variable="variableDef"
          :value="valueFor(variableDef)"
          :validate-required="!machineDeploymentClass && !machinePoolClass"
          @update:value="e=>updateVariables(e, variableDef)"
          @validation-passed="updateErrors"
          @error="e=>$emit('error', e)"
        />
        <div
          v-if="newComponentType(variableDef, i)"
          :key="`${i}-${rerenderKey}`"
          class="force-newline"
        />
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
$standard-input: 23.25%;
$wider-input: 48.25%;
$widest-input: 98.25%;

.variables {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  &>*{
    flex: 0 1 $standard-input;
    margin: 0 1.75% 10px 0;
    max-width: $standard-input;
    &.wider:deep(){
      flex: 0 1 $wider-input;
      max-width: $wider-input;
    }

    &.widest:deep(){
      flex: 0 1 $widest-input;
      max-width: $widest-input;
    }

  }
  &>.force-newline {
    flex: 1 0 100%;
    max-width: initial;
  }
}
</style>
