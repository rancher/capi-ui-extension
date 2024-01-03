
export interface ClusterClassVariable {
  name: string,
  required: boolean,
  schema: {
    openAPIV3Schema: {
      additionalProperties?: Map<string, any>
      default?: any
      description?: string,
      enum?: Array<any>,
      example?: any,
      exclusiveMaximum?: boolean,
      exclusiveMinimum?: boolean,
      format?: string,
      items?: Array<any>,
      maxItems?: number,
      maxLength?: number,
      maximum?: number,
      minItems?: number,
      minLength?: number
      minimum?: number,
      pattern?: string,
      properties?: Map<string, any>,
      required?: Array<String>,
      type: string,
      uniqueItems?: boolean,
      ['x-kubernetes-preserve-unknown-fields']?: boolean
    }
  }
}

export interface ClusterClassSpec {
  variables: Array<ClusterClassVariable>
}

export interface ClusterClass {
name: string,
spec: ClusterClassSpec
}
