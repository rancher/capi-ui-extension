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
    // TODO nb is this on schema?
    namespaced: {
      type:    Boolean,
      default: true
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

  //   created() {
  //     try {
  //       this.$store.dispatch('management/findAll', { type: this.resourceType }).then((res) => {
  //         this.resource = res;
  //       });
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   },

  data() {
    return {
      namespace: '',
      // spinner on resource input when querying by ns
      loading:   false,
      resource:  []
    };
  },

  watch: {
    namespace(neu) {
      if (neu) {
        console.log('ns set to ', neu);
        // check if ns from list or user entered value
        if (this.namespaces.find((n) => n.id === neu)) {
        //   this.fetchResource();
          this.fetchNamespacedResource(neu);
        }
      }
    },
  },

  methods: {
    async fetchNamespacedResource(ns) {
      this.loading = true;

      try {
        this.resource = await this.$store.dispatch('management/findAll', { type: this.resourceType, opt: { namespaced: ns } });
      } catch (err) {
        console.error(err);
      }
      this.loading = false;
    }
  },

  computed: {
    ...mapGetters({ all: 'management/all', matching: 'management/matching' }),

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
        @selecting="e=>$emit('update:value', e)"
      />
    </div>
  </div>
</template>
