<script lang="ts">
import { defineComponent } from 'vue';
import RadioButton from '@/pkg/rancher-components/src/components/Form/Radio/RadioButton';
import RadioGroup from '@/pkg/rancher-components/src/components/Form/Radio/RadioGroup';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

import { ClusterClassVariable } from '../../types/clusterClass.ts';

// clusterclass variables can define a list of valid options for any 'type'
// if type is string or number options will display in a single-choice labeledselect
//
// if the type is 'array':
// if enum values are NOT arrays: show a multi-choice labeledselect
// enum values are arrays: //TODO nb how to display complex enum?
//
// if the type is an object:
// TODO nb how to display complex enum?
//
// if the type is boolean:
// ...silly but possible. Show a checkbox.

export default defineComponent({
  name: 'CCVariablesEnumInput',

  components: {
    RadioGroup,
    RadioButton,
    LabeledSelect,
    Checkbox
  },

  props: {
    variable: {
      type:     ClusterClassVariable,
      required: true
    },
    value: {
      type:    [String, Object, Boolean],
      default: () => null
    }
  },

  computed(){
        schema() {
      return this.variable?.schema?.openAPIV3Schema;
    },

    componentType(){
      const enumValues = schema.enum
      const isComplex = enumValues.find(val => typeof val === 'object')
      if(enumValues.length <= 3 ){
        return 'radio'
      }

    },

    useMultiSelect(){}
  },
});
</script>

<template>
<div>wow_its_fucking_nothing.jpeg</div>
</template>
