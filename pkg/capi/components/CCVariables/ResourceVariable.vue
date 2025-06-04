<script>
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'ResourceVariableInput',

  props: {
    // resource type to search for
    resourceType: {
      type:     String,
      required: true
    },

    label: {
      type:    String,
      default: null
    },
    // resource id
    value: {
      type:    String,
      default: ''
    },
    // validation rules
    // will be passed directly to a labeledselect w/ resource ID as value
    rules: {
      type:    Array,
      default: () => {}
    },

    mode: {
      type:    String,
      default: 'create'
    },
  },

  emits: ['update:value', 'validationPassed'],

  components: { LabeledSelect },

  data() {
    const [namespace = '', name = ''] = (this.value|| '').split('/')
    return {
      namespace: '',
      // spinner on resource input when querying by ns
      loading:   false,
      resource:  []
    };
  },

  watch: {
    namespace(neu, old) {
      if (neu) {
        if(old){
          this.$emit('update:value', '')
        }
        // check if ns from list or user entered value
        if (this.namespaces.find((n) => n.id === neu)) {
          this.fetchResource(neu);
        }
      }
    },
  },

  methods: {
    async fetchResource(ns) {
      this.loading = true;
      const opt = {}
      if(this.namespaced){
        opt.namespaced = ns
      }
      try {
        this.resource = await this.$store.dispatch('management/findAll', { type: this.resourceType, opt});
      } catch (err) {
        console.error(err);
      }
      this.loading = false;
    }
  },

  computed: {
    ...mapGetters({ all: 'management/all', schemaFor: 'management/schemaFor' }),

    namespaced(){
      const schema = this.schemaFor(this.resourceType)

      return !!schema
    },

    namespaces() {
      return this.all('namespace');
    },

    resourceNames() {
      return this.resource.map((r) => r?.metadata?.name || r.id);
    }
  }
};
</script>

<template>
  <div class="row">
    <div
      v-if="namespaced"
      class="col span-6"
    >
      <LabeledSelect
        label="Namespace"
        :mode="mode"
        :value="namespace"
        option-label="id"
        :options="namespaces || []"
        @selecting="e=>namespace=e.id"
        searchable
        taggable
      />
    </div>
    <div class="col span-6">
      <LabeledSelect
        :value="value"
        :loading="loading"
        label="Name"
        :options="resourceNames || []"
        :mode="mode"
        taggable
        searchable
        @selecting="e=>$emit('update:value', e)"
      />
    </div>
  </div>
</template>
