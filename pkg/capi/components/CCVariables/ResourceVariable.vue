<script>
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';
import { NAMESPACE } from '@shell/config/types';

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
    value: {
      type:    Object,
      default: () => {
        return { name: '' };
      }
    },
    // validation rules
    // will be passed directly to a labeledselect w/ resource ID as value
    rules: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    mode: {
      type:    String,
      default: _CREATE
    },

    // if it exists already, default to the cluster's namespace in the namespace dropdown
    clusterNamespace: {
      type:    String,
      default: ''
    },
  },

  emits: ['update:value', 'validationPassed'],

  components: { LabeledSelect },

  created() {
    this.fetchResource(this.clusterNamespace);
  },

  data() {
    return {
      // spinner on resource input when querying by ns
      loading:   false,
      resource:  []
    };
  },

  methods: {
    async fetchResource(ns) {
      this.loading = true;
      const opt = {};

      if (this.namespaced) {
        opt.namespaced = ns;
      }
      try {
        this.resource = await this.$store.dispatch('management/findAll', { type: this.resourceType, opt });
      } catch (err) {
        console.error(err);
      }
      this.loading = false;
    },

    update(name = '') {
      const out = { name };

      if (this.namespaced) {
        out.namespace = this.namespace;
      }

      this.$emit('update:value', out);
    },
  },

  computed: {
    ...mapGetters({ all: 'management/all', schemaFor: 'management/schemaFor' }),

    namespaced() {
      const schema = this.schemaFor(this.resourceType);

      return !!schema && schema?.attributes?.namespaced;
    },

    namespaces() {
      return this.all(NAMESPACE);
    },

    resourceNames() {
      return this.resource.map((r) => r?.metadata?.name || r.id);
    },

    name: {
      get() {
        return this.value?.name || '';
      },
      set(neu) {
        const out = { name: neu };

        if (this.namespaced) {
          out.namespace = this.namespace;
        }

        this.$emit('update:value', out);
      }
    },

    namespace: {
      get() {
        return this.value?.namespace || this.clusterNamespace || '';
      },
      set(neu) {
        const out = { namespace: neu, name: this.name };

        this.$emit('update:value', out);
        // check if ns from list or user entered value
        if (this.namespaces.find((n) => n.id === neu)) {
          this.fetchResource(neu);
        }
      }
    },
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
        label-key="tableHeaders.namespace"
        :mode="mode"
        :value="namespace"
        option-label="id"
        :options="namespaces || []"
        searchable
        taggable
        :rules="rules"
        @selecting="e=>namespace=e?.id"
      />
    </div>
    <div class="col span-6">
      <LabeledSelect
        :value="name"
        :loading="loading"
        label-key="tableHeaders.name"
        :options="resourceNames || []"
        :mode="mode"
        taggable
        searchable
        :rules="rules"
        @selecting="e=>name=e"
      />
    </div>
  </div>
</template>
