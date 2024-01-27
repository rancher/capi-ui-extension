<script lang="ts">
import debounce from 'lodash/debounce';
import Vue from 'vue';

import type { PropType } from 'vue';
import { randomStr } from '@shell/utils/string';
import { ClusterClassVariable } from '../../types/clusterClass';
import type { CapiClusterVariable } from '../../types/cluster.x-k8s.io.cluster';
import { isDefined } from '../../util/validators';
import Variable from './Variable.vue';

export default Vue.extend({
  name: 'ClusterClassVariables',

  components: { Variable },

  props: {
    clusterClass: {
      type:    Object,
      default: () => {}
    },

    value: {
      type:    Array as PropType<Array<CapiClusterVariable>>,
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
      handler: debounce(function(this: any, neu) {
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
      const variableNames = this.machineScopedJsonPatches.reduce((names: string[], patch: any) => {
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

      return allVariableDefinitions.filter((v: ClusterClassVariable) => variableNames.includes(v.name));
    },

    machineScopedJsonPatches() {
      if (!this.machineDeploymentClass && !this.machinePoolClass) {
        return [];
      }
      const out = [] as any[];
      const matchName = this.machineDeploymentClass || this.machinePoolClass;
      const matchKey = this.machineDeploymentClass ? 'machineDeploymentClass' : 'machinePoolClass';

      const patches = this.clusterClass?.spec?.patches || [];

      patches.forEach((p: any) => {
        const definitions = p?.definitions || [];

        definitions.forEach((definition: any) => {
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
    valueFor(variableDef: ClusterClassVariable) {
      return (this.value.find((variable: any) => variable.name === variableDef.name) || {}).value;
    },

    updateVariables(val: any, variableDef: ClusterClassVariable) {
      const out = [...this.value] as Array<any>;
      const existingIdx = this.value.findIndex((variable: any) => variable.name === variableDef.name);

      if (existingIdx >= 0) {
        out[existingIdx].value = val;
      } else {
        out.push({ value: val, name: variableDef.name });
      }
      this.$emit('input', out);
    },

    // update the cluster's variables when the cluster class changes
    updateVariableDefaults(neu: ClusterClassVariable[], old: ClusterClassVariable[]) {
      // remove or update variables from previous cc
      const out = [...this.value].reduce((acc: CapiClusterVariable[], existingVar: CapiClusterVariable) => {
        const neuDef = (neu || []).find(n => n.name === existingVar.name);

        // do not include variables not defined in the new cluster class
        if (!neuDef) {
          return acc;
        }
        const oldDefault = (old || []).find(d => d.name === existingVar.name)?.schema?.openAPIV3Schema?.default;

        // if a variable is set to the previous definition's default, clear it out
        if (isDefined(oldDefault) && existingVar.value === oldDefault) {
          delete existingVar.value;
        }
        let newDefault = neuDef.schema?.openAPIV3Schema?.default;

        // leaving boolean values undefined causes confusing form validation behaviour if the boolean is marked as required
        // if the default value isn't set for a boolean, assume the default is false
        if (neuDef.schema?.openAPIV3Schema?.type === 'boolean' && !newDefault) {
          newDefault = false;
        }

        // if the value hasn't been touched by the user set it to the new cc default
        if (isDefined(newDefault) && !existingVar.value) {
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
        if (isDefined(newDefault) && !out.find(v => v.name === def.name)) {
          out.push({ name: def.name, value: newDefault });
        }
      });

      this.errorCount = 0;
      this.$emit('input', out);
    },

    updateErrors(isValid: boolean) {
      if (!isValid) {
        this.errorCount++;
      } else {
        this.errorCount--;
      }
    },

    newComponentType(variableDef: ClusterClassVariable, i: number) {
      const refs = this.$refs as {[key:string]: any[]};
      const inputEl = refs[`${ variableDef.name }-input`]?.[0]?.$el;
      const nextInputEl = refs[`${ this.variableDefinitions[i + 1]?.name }-input`]?.[0]?.$el;

      if (!nextInputEl) {
        return false;
      }

      return inputEl?._prevClass !== nextInputEl._prevClass;
    }
  },

});
</script>

<template>
  <div class="variables">
    <template v-if="variableDefinitions && variableDefinitions.length">
      <template v-for="(variableDef, i) in variableDefinitions">
        <Variable
          :key="`${variableDef.name}`"
          :ref="`${variableDef.name}-input`"
          :variable="variableDef"
          :value="valueFor(variableDef)"
          :validate-required="!machineDeploymentClass && !machinePoolClass"
          @input="e=>updateVariables(e, variableDef)"
          @validation-passed="updateErrors"
        />
        <div v-if="newComponentType(variableDef, i)" :key="`${i}-${rerenderKey}`" class="force-newline" />
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
$standard-input: 23.25%;
$wider-input: 48.25%;

.variables {
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
