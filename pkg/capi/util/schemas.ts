import { createYaml } from '@shell/utils/create-yaml';
import {  randomStr } from '@shell/utils/string';


// type JSONSchemaProps = {
//     type: string,
//     properties: any,
//     additionalProperties: any,
//     items: JSONSchemaProps
// }

type openAPIV3Schema = {
    additionalProperties?: Map<string, any>
    default?: any
    description?: string,
    enum?: Array<any>,
    example?: any,
    exclusiveMaximum?: boolean,
    exclusiveMinimum?: boolean,
    format?: string,
    items?: openAPIV3Schema,
    maxItems?: number,
    maxLength?: number,
    maximum?: number,
    minItems?: number,
    minLength?: number
    minimum?: number,
    pattern?: string,
    properties?: Map<string, openAPIV3Schema>,
    required?: Array<String>,
    type: string,
    uniqueItems?: boolean,
    ['x-kubernetes-preserve-unknown-fields']?: boolean
  }
 
 type ClusterClassVariable = {
    name: string,
    required: boolean,
    schema: {
      openAPIV3Schema: openAPIV3Schema
    }
  }

  const SIMPLE_TYPES = ['string', 'int', 'boolean']

/**
 * 
 * @param openSchema 
 * 
 * @param id 
 * @returns 
 * 
 * 
 * {
 *  id: string uid for schema
 *  resourceFields: map of
 *          [string]: {
 *              type: string uid of subtype 
 *          }
 * }
 * For each def in openSchema properties, EITHER add it to the mockSchema resourcefields if string/bool/int
 *  OR generate a sub mock schema + mock sub schema uid for it AND add it to mockSchema resourcefields
 * 
 * 
 * 
 */


export const makeSchemas = function(openSchema: openAPIV3Schema, id='ccvariable', key=randomStr()){

    const schemas = []
    if(openSchema.type === 'array'){
        // createYaml expects objects so make an object {placeholder: <thing I actually care about>[]} then strip the placeholder from the sample string
        const placeholder = randomStr()
        const subtype = randomStr()
        const mockSchema = { id, resourceFields: { [key]: { type: 'array', subtype: subtype } } };
        const mockSchemaSub = { id: subtype, resourceFields: openSchema?.items?.properties };
        schemas.push(mockSchema)
        schemas.push(mockSchemaSub)
        // let out;
    
        // try {
        //   out = createYaml([mockSchema, mockSchemaSub], 'ccvariable', {}, false);
        // } catch (err) {
        //   console.error(err);
        // }
        // // remove first line, don't need a key just the array
        // const sliced = out.slice(out.indexOf('\n') + 1);
    
    
        // return sliced;
        // additionalProperties are used with map types
    } else if(openSchema.additionalProperties) {

        // must be a generic object
    } else {
        console.log('openSchema:', openSchema)
        const properties = openSchema?.properties || {}
        console.log('properties: ', properties)
        const mockSchema = { id, resourceFields: {} };
        console.log('mockSchema: ', mockSchema)

        schemas.push(mockSchema)
        for(let key in properties){
            // make a uid for each type
            const subtypeId = randomStr()
            const def = properties[key]
            console.log('key: ', key)
            console.log('def: ', def)

            if(SIMPLE_TYPES.includes(def.type)){
                mockSchema.resourceFields[key] = def
            } else {
            // heh
            const subSchemaSubSchemas = makeSchemas(properties[key], subtypeId, key)

            schemas.push(...subSchemaSubSchemas)
            console.log('subSchemaSubSchemas: ', subSchemaSubSchemas)
            mockSchema.resourceFields[key] = {type: subtypeId }
            
            }

        }

    }

    return schemas
}


export const makeYamlPlaceholders = function(openSchema: openAPIV3Schema){
        const schemas = makeSchemas(openSchema)
        let out;
    console.log('all schemas: ', schemas)
        try {
          out = createYaml(schemas, 'ccvariable', {}, false);
        } catch (err) {
          console.error(err);
        }

        if(openSchema.type === 'array'){
        // remove first line, don't need a key just the array
        const sliced = out.slice(out.indexOf('\n') + 1);
        return sliced;

        }

    
    return out



}