export default [{
  name:     'string-required',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     'us-east-1',
        description: 'This string has only required validation'
      }
    }
},

{
  name:     'string-min-length',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     'default',
        description: 'this string has a rule that its length must be greater than or equal to 3',
        example:     'sshkeyexample',
        minLength:   3
      }
    }
},
{
  name:     'string-max-length',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     't3.large',
        description: 'this string has a rule that its length must be less than or equal to 10',
        maxLength:   10
      }
    }
},
{
  name:     'string-min-max-length',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     't3.large',
        description: 'this string has a rules that its length must be between 3 and 10',
        maxLength:   10,
        minLength:   3
      }
    }
},

{
  name:     'string-pattern',
  required: true,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     'default',
        description: 'this string must match the pattern /^[a-z]+-[0-9]+$/',
        example:     'sshkeyexample',
        pattern:     '^[a-z]+-[0-9]+$'
      }
    }
},
{
  name:     'string-no-validate',
  required: false,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'string',
        default:     't3.large',
        description: 'this string has no validation'
      }
    }
},

{
  name:     'number-exclusive-min-max',
  required: false,
  schema:
    {
      openAPIV3Schema:
      {
        type:             'number',
        default:          3,
        description:      'this string has exclusive min max of 2 and 5',
        exclusiveMinimum: true,
        exclusiveMaximum: true,
        minimum:          2,
        maximum:          5
      }
    }
},

{
  name:     'number-inclusive-min-max',
  required: false,
  schema:
    {
      openAPIV3Schema:
      {
        type:        'number',
        default:     3,
        description: 'this string has inclusive min max of 2 and 5',
        minimum:     2,
        maximum:     5
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
  name:     'testArrayStrings-min',
  schema:
    {
      openAPIV3Schema:
      {
        type:        'array',
        description: 'This array must have at least 3 items',
        items:
          { type: 'string' },
        minItems: 3
      }
    }
},
{
  name:     'testArrayStrings-max',
  schema:
    {
      openAPIV3Schema:
      {
        type:        'array',
        description: 'This array must have at most 5 items',
        items:
          { type: 'string' },
        maxItems: 5
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
        description: 'This is an array type with enum defined. It may have at most two elements',
        enum:
          ['option_1', 'option_2', 'option_3'],
        maxItems: 2
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
},
];
