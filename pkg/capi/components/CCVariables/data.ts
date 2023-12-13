export default [{
  name:     'region',
  required: false,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        // default:     'us-east-1',
        description: 'The Azure region to create machines in'
      }
    }
},

{
  name:     'sshKeyName',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     'default',
        description: 'SSH key name description text go here',
        example:     'sshkeyexample'
      }
    }
},
{
  name:     'controlPlaneMachineType',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:    'string',
        default: 't3.large'
      }
    }
},
{
  name:     'workerMachineType',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:    'string',
        default: 't3.large'
      }
    }
},
{
  name:     'testBoolean',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'boolean',
        description: 'This is a test value'
      }
    }
},
{
  name:     'testArrayStrings',
  schema:
    {
      openAPIV3Schema:
      {
        type:        'array',
        description: 'This is a test array value',
        items:
          { type: 'string' }
      }
    }
},
{
  name:     'enums',
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        description: 'This is a string type with enum defined',
        enum:
          ['option_1', 'option_2', 'option_3']
      }
    }
},
{
  name:     'enums-multi',
  schema:
    {
      openAPIV3Schema:
      {
        type:        'array',
        description: 'This is an array type with enum defined',
        enum:
          ['option_1', 'option_2', 'option_3']
      }
    }
},
{
  name:     'enums-object',
  schema:
    {
      openAPIV3Schema:
      {
        type:        'object',
        description: 'This is an object type with enum defined',
        enum:
          [{ option_1: '1' }, { option_2: '2' }, { option_3: '3' }]
      }
    }
}];
