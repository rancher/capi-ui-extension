<script>
import { LABELS } from '../../types/capi';
import { randomStr } from '@shell/utils/string';
import Variable from './Variable.vue';
import GroupPanel from '@shell/components/GroupPanel';

export default {
  name: 'ClusterClassVariables',

  components: { Variable, GroupPanel },
  emits:      ['validation-passed', 'update:value'],

  props: {
    // cluster.x-k8s.io.clusterclass
    clusterClass: {
      type:    Object,
      default: () => {}
    },

    // cluster.x-k8s.io.cluster   .spec.variables
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    // pool or deployment
    machineClassType: {
      type:    String,
      default: null
    },

    // if this and class type are provided, only variables associated with a jsonPatch that lists matchResources.<machineClassType>.<this class> will be shown
    machineClassName: {
      type:    String,
      default: null
    }

  },

  data() {
    // this key is used on the spacer element so it can be forced to re-calculate its visibility when the cluster class changes
    return { errorCount: 0, rerenderKey: randomStr() };
  },

  watch: {
    // TODO nb is lack of debounce all that bad
    errorCount(neu) {
      this.$emit('validation-passed', !neu);
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

      // TODO nb what if these are already set per pool? Do they need to be set globally? Should they not be set globally?
      if (!this.machineClassType && !this.machineClassName) {
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

    // use variable metadata to add vars to groups
    // TODO nb perhaps a less silly way of keeping ungrouped at the end
    groupedVariableDefinitions() {
      const out = { aaaaungrouped: [] };

      this.variableDefinitions.forEach((spec) => {
        const group = spec?.metadata?.labels?.[LABELS.GROUP];

        if (group) {
          if (!out[group]) {
            out[group] = [spec];
          } else {
            out[group].push(spec);
          }
        } else {
          out.aaaaungrouped.push(spec);
        }
      });

      return out;
    },

    machineScopedJsonPatches() {
      if (!this.machineClassName && !this.machineClassType) {
        return [];
      }
      const out = [];
      const matchName = this.machineClassName;

      const matchKey = this.machineClassType;

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
    }
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
      const refs = this.$refs;
      const inputEl = refs[`${ variableDef.name }-input`]?.[0]?.$el;
      const nextInputEl = refs[`${ this.variableDefinitions[i + 1]?.name }-input`]?.[0]?.$el;

      if (!nextInputEl) {
        return false;
      }

      return inputEl?._prevClass !== nextInputEl._prevClass;
    }
  },

};
</script>

<template>
  <template v-if="groupedVariableDefinitions">
    <div
      v-for="group in Object.keys(groupedVariableDefinitions).sort()"
      :key="group"
      class="mb-40"
    >
      <GroupPanel
        v-if="group !== 'aaaaungrouped'"
        :label="group"
      >
        <div class="variables-group">
          <template
            v-for="(variableDef, i) in groupedVariableDefinitions[group]"

            :key="`${variableDef.name}`"
          >
            <Variable
              :ref="`${variableDef.name}-input`"
              :all-variables="value"
              :variable="variableDef"
              :value="valueFor(variableDef)"
              :validate-required="!machineDeploymentClass && !machinePoolClass"
              @update:value="e=>updateVariables(e, variableDef)"
              @validation-passed="updateErrors"
            />
            <div
              v-if="newComponentType(variableDef, i)"
              :key="`${i}-${rerenderKey}`"
              class="force-newline"
            />
          </template>
        </div>
      </GroupPanel>
      <div
        v-else
        class="variables-group"
      >
        <template
          v-for="(variableDef, i) in groupedVariableDefinitions.aaaaungrouped"

          :key="`${variableDef.name}`"
        >
          <Variable
            :ref="`${variableDef.name}-input`"
            :all-variables="value"
            :variable="variableDef"
            :value="valueFor(variableDef)"
            :validate-required="!machineDeploymentClass && !machinePoolClass"
            @update:value="e=>updateVariables(e, variableDef)"
            @validation-passed="updateErrors"
          />
          <div
            v-if="newComponentType(variableDef, i)"
            :key="`${i}-${rerenderKey}`"
            class="force-newline"
          />
        </template>
      </div>
    </div>
  </template>
</template>

<style lang="scss" scoped>
$standard-input: 23.25%;
$wider-input: 48.25%;

.variables-group {
  margin-top: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  &>*{
    flex: 0 1 $standard-input;
    margin: 0 1.75% 10px 0;
    max-width: $standard-input;
    &::v-deep.wider{
      flex: 0 1 $wider-input;
      max-width: $wider-input;
    }

  }
  &>.force-newline {
    flex: 1 0 100%;
    max-width: initial;
  }
}
</style>
