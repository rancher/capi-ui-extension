import { createYaml } from '@shell/utils/create-yaml';
import { randomStr } from '@shell/utils/string';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import YamlEditor from '@shell/components/YamlEditor.vue';
import ToggleSwitch from '@components/Form/ToggleSwitch/ToggleSwitch.vue';
import ResourceVariable from '../components/CCVariables/ResourceVariable.vue';
import { ANNOTATIONS } from '../types/capi';

export const VARIABLE_INPUT_NAMES = {
  TEXT:           'text-var',
  BOOL:        'checkbox-var',
  BOOL_TOGGLE:       'toggle-var',
  MAP:         'keyvalue-var',
  MAP_YAML:    'keyvalue-yaml-var',
  ARRAY:          'arraylist-var',
  YAML:           'yamleditor-var',
  SEARCH_TYPE: 'resourcevariable-var'
};

/**
 *
 * @param variable  <clusterclass>.spec.variables[]
 * @param all variables[]
 * @returns bool true if a variable in all has a toggle annotation that includes this variable's name
 */
export const isToggle = (variable, all) => {
  return !!(all || []).filter((v) => (v?.metadata?.annotations?.[ANNOTATIONS.TOGGLED_BY] || '').split(',').map((n) => n.replace(' ', '')).includes(variable.name)).length || variable.name.includes('toggle');
};

// in addition to having a resource type annotation variables need to be an object with name and optionally namespace keys to use the ResourceVariable component
const isResourceVariable = (variable) => {
  const schema = variable?.schema?.openAPIV3Schema || {};
  const { properties = {} } = schema;

  if (!variable?.metadata?.annotations?.[ANNOTATIONS.SEARCH_TYPE]) {
    return false;
  }

  return properties?.name && properties?.name?.type === 'string' && !Object.keys(properties).find((p) => p !== 'name' && p !== 'namespace');
};

/**
 * Accepts a clusterclass variable schema and determines which input component would best represent that variable
 * The 'name' field of the output is used by the component containing all variable inputs, to position inputs dependent on their type
 * @param variable <clusterclass>.spec.variables[]
 * @param all variables[] (optional - used to decide whether or not is toggle)
 * @returns /{component: <input component>, name: string name of input component}
 */
export const componentForType = (variable, all) => {
  let out;
  const schema = variable?.schema?.openAPIV3Schema || {};
  let { type } = schema;

  const hasEnum = schema?.enum && schema?.enum?.length;

  if (schema.additionalProperties) {
    type = 'map';
  }

  if (hasEnum) {
    out = { component: LabeledSelect, name: VARIABLE_INPUT_NAMES.TEXT };
  } else {
    switch (type) {
    case 'object':
      if (isResourceVariable(variable)) {
        out = { component: ResourceVariable, name: VARIABLE_INPUT_NAMES.SEARCH_TYPE };
      } else {
        out = { component: YamlEditor, name: VARIABLE_INPUT_NAMES.YAML };
      }
      break;
    case 'map':
      if (schema.additionalProperties.properties) {
        out = { component: KeyValue, name: VARIABLE_INPUT_NAMES.MAP_YAML };
      } else {
        out = { component: KeyValue, name: VARIABLE_INPUT_NAMES.MAP };
      }
      break;
    case 'array':
      if (SIMPLE_TYPES.includes(schema?.items?.type) ) {
        out = { component: ArrayList, name: VARIABLE_INPUT_NAMES.ARRAY };
      } else {
        out = { component: YamlEditor, name: VARIABLE_INPUT_NAMES.YAML };
      }
      break;
    case 'string':
      out = { component: LabeledInput, name: VARIABLE_INPUT_NAMES.TEXT };
      break;
    case 'integer':
      out = { component: LabeledInput, name: VARIABLE_INPUT_NAMES.TEXT };

      break;
    case 'number':
      out = { component: LabeledInput, name: VARIABLE_INPUT_NAMES.TEXT };

      break;
    case 'boolean':
      if (isToggle(variable, all)) {
        out = { component: ToggleSwitch, name: VARIABLE_INPUT_NAMES.BOOL_TOGGLE };
      } else {
        out = { component: Checkbox, name: VARIABLE_INPUT_NAMES.BOOL };
      }

      break;
    default:
      break;
    }
  }

  return out;
};

// types that do not require an additional schema definition
export const SIMPLE_TYPES = ['string', 'int', 'boolean'];

/**
 * This function accepts the schema from a clusterclass variable definition and parses it into the same schema format that steve schemas use.
 * Allows us to generate yaml previews of expected capi cluster variable specification for a more guided cluster creation experience
 * @param openSchema object - openAPIV3Schema property of a clusterclass variable definition
 * @param id string - used while generating sub-schemas for complex fields (e.g. an array of objects will have a schema for the array which references a schema for the object)
 * @returns - array of "schema" in the same format as our /schemaDefinitions/<type> endpoint
 */
export const makeSchemas = function(openSchema, id = 'ccvariable') {
  const schemas = [];

  /**
   * variables that are arrays at the top level are treated a little differently
   * the desired output is not a valid yaml spec so we use a placeholder string to create something like:
   * #placeholder:
   *  - realVariableProp1: string
   *    realVariableProp2: string
   * OR something like
   * #placeholder:
   *  - string
   * then strip the first line of output to remove the placeholder
   */
  if (openSchema.type === 'array' && id === 'ccvariable') {
    const placeholder = randomStr();
    const subtype = randomStr();
    const mockSchema = { id, resourceFields: { [placeholder]: { type: 'array', subtype } } };
    const mockSchemaSub = { id: subtype, resourceFields: openSchema?.items?.properties };

    schemas.push(mockSchema);
    schemas.push(mockSchemaSub);
  } else {
    const properties = openSchema.type === 'array' ? openSchema?.items?.properties : openSchema.additionalProperties?.properties || openSchema?.properties;

    const mockSchema = { id, resourceFields: {} };

    schemas.push(mockSchema);
    for (const key in properties) {
      // make a uid for each type
      const subtypeId = randomStr();
      const def = properties[key];

      if (SIMPLE_TYPES.includes(def.type)) {
        mockSchema.resourceFields[key] = def;
      } else if (def.type === 'array') {
        if (SIMPLE_TYPES.includes(def.items.type)) {
          mockSchema.resourceFields[key] = { type: 'array', subtype: def.items.type };
        } else {
        // heh
          const subSchemaSubSchemas = makeSchemas(properties[key], subtypeId);

          schemas.push(...subSchemaSubSchemas);
          mockSchema.resourceFields[key] = { type: 'array', subtype: subtypeId };
        }
      } else if (def.additionalProperties) {
        if (SIMPLE_TYPES.includes(def.additionalProperties.type)) {
          mockSchema.resourceFields[key] = { type: 'map', subtype: def.additionalProperties.type };
        } else {
          const subSchemaSubSchemas = makeSchemas(properties[key], subtypeId);

          schemas.push(...subSchemaSubSchemas);
          mockSchema.resourceFields[key] = { type: 'map', subtype: subtypeId };
        }
      } else {
        const subSchemaSubSchemas = makeSchemas(properties[key], subtypeId);

        schemas.push(...subSchemaSubSchemas);

        mockSchema.resourceFields[key] = { type: subtypeId };
      }
    }
  }

  return schemas;
};

/**
 *
 * @param openSchema object - openAPIV3Schema property of a clusterclass variable definition
 * @param data existing variable configuration
 * @returns string - yaml preview of fields defined in the openAPIV3Schema
 */
export const makeYamlPlaceholders = function(openSchema, data = {}) {
  const schemas = makeSchemas(openSchema);
  let out;

  try {
    out = createYaml(schemas, 'ccvariable', data, false);
  } catch (err) {
  }

  if (openSchema.type === 'array') {
    // remove first line, don't need a key just the array
    const sliced = out.slice(out.indexOf('\n') + 1);

    return sliced;
  }

  return out;
};
