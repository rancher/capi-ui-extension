
export interface ClusterClassVariable {
  name: String,
  required: Boolean,
  schema: {
    openAPIV3Schema: {
      additionalProperties?: Map<string, any>
      default?: any
      description?: String,
      enum?: Array<any>,
      example?: any,
      exclusiveMaximum?: Boolean,
      exclusiveMinimum?: Boolean,
      format?: String,
      items?: Array<any>,
      maxItems?: Number,
      maxLength?: Number,
      maximum?: Number,
      minItems?: Number,
      minLength?: Number
      minimum?: Number,
      pattern?: String,
      properties?: Map<string, any>,
      required?: Array<String>,
      type: String,
      uniqueItems?: Boolean,
      ['x-kubernetes-preserve-unknown-fields']?: Boolean
    }
  }
}

export interface ClusterClassSpec {
  variables: Array<ClusterClassVariable>
}

export interface ClusterClass {
name: String,
spec: ClusterClassSpec
}
