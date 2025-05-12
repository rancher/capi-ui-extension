import { createYaml } from '@shell/utils/create-yaml';
import { randomStr } from '@shell/utils/string';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import YamlEditor from '@shell/components/YamlEditor';

// type JSONSchemaProps = {
//     type: string,
//     properties: any,
//     additionalProperties: any,
//     items: JSONSchemaProps
// }

// type openAPIV3Schema = {
//     additionalProperties?: Map<string, any>
//     default?: any
//     description?: string,
//     enum?: Array<any>,
//     example?: any,
//     exclusiveMaximum?: boolean,
//     exclusiveMinimum?: boolean,
//     format?: string,
//     items?: openAPIV3Schema,
//     maxItems?: number,
//     maxLength?: number,
//     maximum?: number,
//     minItems?: number,
//     minLength?: number
//     minimum?: number,
//     pattern?: string,
//     properties?: Map<string, openAPIV3Schema>,
//     required?: Array<String>,
//     type: string,
//     uniqueItems?: boolean,
//     ['x-kubernetes-preserve-unknown-fields']?: boolean
//   }

//  type ClusterClassVariable = {
//     name: string,
//     required: boolean,
//     schema: {
//       openAPIV3Schema: openAPIV3Schema
//     }
//   }

export const componentForType = (schema) => {
  let out;

  let { type } = schema;

  const hasEnum = schema?.enum && schema?.enum?.length;

  if (schema.additionalProperties) {
    type = 'map';
  }

  if (hasEnum) {
    out = { component: LabeledSelect, name: 'text-var' };
  } else {
    switch (type) {
    case 'object':
      // out = { component: KeyValue, name: 'keyvalue-var' };
      out = { component: YamlEditor, name: 'yamleditor-var' };
      break;
    case 'map':
      if (schema.additionalProperties.properties) {
        out = { component: KeyValue, name: 'keyvalue-yaml-var' };
      } else {
        out = { component: KeyValue, name: 'keyvalue-var' };
      }
      break;
    case 'array':
      // TODO nb test boolean values?
      if (SIMPLE_TYPES.includes(schema?.items?.type) ) {
        out = { component: ArrayList, name: 'arraylist-var' };
      } else {
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
};

export const SIMPLE_TYPES = ['string', 'int', 'boolean'];

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

  // additionalProperties are used with map types
  }
  // else if (openSchema.additionalProperties && id === 'ccvariable') {
  //   const placeholder = randomStr();

  //   if (SIMPLE_TYPES.includes(openSchema.additionalProperties.type)) {
  //     const mockSchema = { id, resourceFields: { [placeholder]: { type: 'map', subtype: openSchema.additionalProperties.type } } };

  //     schemas.push(mockSchema);
  //   } else {
  //     const subtype = randomStr();
  //     const mockSchema = { id, resourceFields: { [placeholder]: { type: 'map', subtype } } };
  //     const mockSchemaSub = { id: subtype, resourceFields: openSchema?.additionalProperties?.properties };

  //     schemas.push(mockSchema);
  //     schemas.push(mockSchemaSub);
  //   }

  // // must be a generic object
  // }
  else {
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

export const makeYamlPlaceholders = function(openSchema, data = {}) {
  const schemas = makeSchemas(openSchema);
  let out;

  try {
    out = createYaml(schemas, 'ccvariable', data, false);
  } catch (err) {
    console.error(err);
  }

  if (openSchema.type === 'array') {
    // remove first line, don't need a key just the array
    const sliced = out.slice(out.indexOf('\n') + 1);

    return sliced;
  }

  // if (openSchema.additionalProperties) {
  //   const sliced = out.slice(out.indexOf(`:`) + 1);

  //   return `#${ sliced }`;
  // }

  return out;
};
