<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';
import Variable from './Variable.vue';
import { componentForType } from '../../util/clusterclass-variables';
import { LABELS, ANNOTATIONS } from '../../types/capi';
import GroupPanel from '@shell/components/GroupPanel';
import { FORM_SECTIONS } from '../../edit/cluster.x-k8s.io.cluster/ClusterConfig.vue';
import Accordion from '@components/Accordion/Accordion.vue';

export default {
  name: 'ClusterClassVariables',

  components: {
    Variable, GroupPanel, Accordion
  },
  emits: ['validation-passed', 'update:value', 'update-variables'],

  props: {
    // cluster.x-k8s.io.clusterclass
    clusterClass: {
      type:    Object,
      default: () => {}
    },

    // cluster.x-k8s.io.cluster .spec.variables
    // or .spec.machinePools[].variables.overrides
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
    },

    // used in machine context to display the global value as a placeholder
    globalVariables: {
      type:    Array,
      default: () => []
    },

    section: {
      type:    String,
      default: ''
    },
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
      if (!this.isMachineScoped) {
        this.updateVariableDefaults(neu, old);
      }
      this.$nextTick(() => {
        this.rerenderKey = randomStr();
      });
    },
  },

  created() {
    if (!this.isMachineScoped) {
      this.updateVariableDefaults(this.variableDefinitions, []);
    }
  },

  computed: {
    ...mapGetters({ withFallback: 'i18n/withFallback' }),

    // this.value is all variable values for the cluster
    // ownedVariables are the subset of those variables that this instance of CCVariables controls
    ownedVariables() {
      return this.value.filter((v) => this.ownedVariableNames.includes(v.name));
    },

    // is  the component being used for top  level cluster variables or machine overrides?
    isMachineScoped() {
      return this.machineClassName && this.machineClassType;
    },

    // if not machine scoped, scope using section prop
    // if neither machine scoped nor section scoped show all variables that are not section scoped
    variableDefinitions() {
      const allVariableDefinitions = this.clusterClass?.spec?.variables || [];

      if (!this.isMachineScoped) {
        // variables with annotation matching this section
        if (this.section) {
          return allVariableDefinitions.filter((v) => v?.metadata?.annotations?.[ANNOTATIONS.SECTION] === this.section);
          // if this component doesn't have section prop show all variables without section prop
          // and all variables with a section prop that does not match the list  shown in ClusterConfig (FORM_SECTIONS)
        } else {
          return allVariableDefinitions.filter((v) => !Object.values(FORM_SECTIONS).includes(v?.metadata?.annotations?.[ANNOTATIONS.SECTION]) || !v?.metadata?.annotations?.[ANNOTATIONS.SECTION]);
        }
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

    // group variables by section
    // if this component has a section prop defined, this will return
    // {misc: [], [this.section]: <this sections variables>[]}
    sectionedVariableDefinitions() {
      const out = { misc: [] };

      this.variableDefinitions.forEach((spec) => {
        const section = spec?.metadata?.annotations?.[ANNOTATIONS.SECTION];

        if (section) {
          if (!out[section]) {
            out[section] = [spec];
          } else {
            out[section].push(spec);
          }
        } else {
          out.misc.push(spec);
        }
      });

      return out;
    },

    // use variable metadata to add vars to groups
    // TODO nb perhaps a less silly way of keeping ungrouped at the end
    groupedVariableDefinitions() {
      const out = { };

      for (const section in this.sectionedVariableDefinitions) {
        const grouped = { misc: [] };

        this.sectionedVariableDefinitions[section].forEach((spec) => {
          const group = spec?.metadata?.annotations?.[ANNOTATIONS.GROUP];

          if (group) {
            if (!grouped[group]) {
              grouped[group] = [spec];
            } else {
              grouped[group].push(spec);
            }
          } else {
            grouped.misc.push(spec);
          }
        });

        out[section] = grouped;
      }

      return out;
    },

    // an instance of CCVariables may display only a subset of cluster class' variables
    // if it is section scoped
    // if it is machine scoped
    ownedVariableNames() {
      const out = [];

      Object.keys(this.groupedVariableDefinitions || {}).forEach((s) => {
        Object.keys(this.groupedVariableDefinitions[s] || {}).forEach((g) => {
          const group = this.groupedVariableDefinitions[s][g] || [];

          if (group.length) {
            out.push(...group.map((v) => v.name));
          }
        });
      });

      return out;
    },

    machineScopedJsonPatches() {
      if (!this.isMachineScoped) {
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
    },

  },

  methods: {
    valueFor(variableDef) {
      return (this.value.find((variable) => variable.name === variableDef.name) || {}).value;
    },

    updateVariables(val, variableDef) {
      const out = [...this.ownedVariables];
      const existingIdx = this.ownedVariables.findIndex((variable) => variable.name === variableDef.name);

      if (existingIdx >= 0) {
        out[existingIdx].value = val;
      } else {
        out.push({ value: val, name: variableDef.name });
      }
      this.$emit('update-variables', out, this.ownedVariableNames);

      this.$emit('update:value', out);
    },

    // update the cluster's variables when the cluster class changes
    // will not  be run when the component is used in machine context
    updateVariableDefaults(neu, old) {
      // remove or update variables from previous cc
      const out = [...this.ownedVariables].reduce((acc, existingVar) => {
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
      this.$emit('update-variables', out, this.ownedVariableNames);

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
        return componentForType(variableDef?.schema?.openAPIV3Schema, variableDef?.name)?.name !== componentForType(nextVariableDef?.schema?.openAPIV3Schema, variableDef?.name)?.name;
      }
    }
  },

};
</script>

<template>
  <template v-if="groupedVariableDefinitions">
    <div
      v-for="(s, key) in groupedVariableDefinitions"
      :key="key"
    >
      <Accordion
        v-if="!section && !isMachineScoped"
        class="mt-20"
        :title="withFallback(`capi.variables.${key}`, null, key)"
        open-initially
      >
        <div
          v-for="(group, label) in s"
          :key="label"
          class="mb-40"
        >
          <GroupPanel
            v-if="label !== 'misc'"
            class="ccvariable-group-panel"
            :label="label"
          >
            <div class="variables-group">
              <template
                v-for="(variableDef, i) in group"

                :key="`${variableDef.name}`"
              >
                <Variable
                  :ref="`${variableDef.name}-input`"
                  :all-variables="value"
                  :variable="variableDef"
                  :value="valueFor(variableDef)"
                  :is-machine-scoped="isMachineScoped"
                  :global-variables="globalVariables"
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
              v-for="(variableDef, i) in group"

              :key="`${variableDef.name}`"
            >
              <Variable
                :ref="`${variableDef.name}-input`"
                :global-variables="globalVariables"
                :all-variables="value"
                :variable="variableDef"
                :value="valueFor(variableDef)"
                :validate-required="!isMachineScoped"
                :is-machine-scoped="isMachineScoped"
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
      </Accordion>
      <div v-else>
        <div
          v-for="(group, label) in s"
          :key="label"
          class="mb-40"
        >
          <GroupPanel
            v-if="label !== 'misc'"
            class="ccvariable-group-panel"
            :label="label"
          >
            <div class="variables-group">
              <template
                v-for="(variableDef, i) in group"

                :key="`${variableDef.name}`"
              >
                <Variable
                  :ref="`${variableDef.name}-input`"
                  :all-variables="value"
                  :variable="variableDef"
                  :value="valueFor(variableDef)"
                  :is-machine-scoped="isMachineScoped"
                  :global-variables="globalVariables"
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
              v-for="(variableDef, i) in group"

              :key="`${variableDef.name}`"
            >
              <Variable
                :ref="`${variableDef.name}-input`"
                :global-variables="globalVariables"
                :all-variables="value"
                :variable="variableDef"
                :value="valueFor(variableDef)"
                :validate-required="!isMachineScoped"
                :is-machine-scoped="isMachineScoped"
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
      </div>
    </div>
  </template>
  <!-- <template v-if="groupedVariableDefinitions">
    <div
      v-for="group in Object.keys(groupedVariableDefinitions).sort()"
      :key="group"
      class="mb-40"
    >
      <GroupPanel
        v-if="group !== 'misc'"
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
              :is-machine-scoped="isMachineScoped"
              :global-variables="globalVariables"
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
          v-for="(variableDef, i) in groupedVariableDefinitions.misc"

          :key="`${variableDef.name}`"
        >
          <Variable
            :ref="`${variableDef.name}-input`"
            :global-variables="globalVariables"
            :all-variables="value"
            :variable="variableDef"
            :value="valueFor(variableDef)"
            :validate-required="!isMachineScoped"
            :is-machine-scoped="isMachineScoped"
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
  </template> -->
</template>

<style lang="scss" scoped>
$standard-input: 23.25%;
$wider-input: 48.25%;
$widest-input: 98.25%;
$group-indent: 5%;

.ccvariable-group-panel {
  margin: 0px $group-indent 0px 0px ;
}

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

    &::v-deep.widest{
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
