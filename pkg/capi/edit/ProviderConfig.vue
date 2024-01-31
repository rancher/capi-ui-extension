<script lang='ts'>
import Vue, { VueConstructor } from 'vue';
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import { clear } from '@shell/utils/array';
import { NAMESPACE } from '@shell/config/types';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import FormValidation from '@shell/mixins/form-validation';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { randomStr } from '@shell/utils/string';
import { clone, set } from '@shell/utils/object';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import { HIDE_SENSITIVE } from '@shell/store/prefs';
import KeyValue from '@shell/components/form/KeyValue.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { PROVIDER_TYPES } from '../types/capi';

const defaultSpec = {
  name:         '',
  type:         'infrastructure',
  variables:    {},
  configSecret: { name: '' },
  credentials:  { rancherCloudCredential: '' },
  features:     {
    clusterResourceSet: true,
    clusterTopology:    true,
    machinePool:        true,
  }
};

export default (Vue as VueConstructor<
  Vue & InstanceType<typeof CreateEditView>
>).extend({
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    RadioGroup,
    SelectCredential,
    Checkbox,
    KeyValue,
    LabeledInput
  },
  mixins: [CreateEditView, FormValidation],
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    provider: {
      type:     String,
      required: true,
    }
  },
  beforeMount() {
    this.initSpecs();
    this.getNamespaces().then((ns: string) => {
      this.allNamespaces = ns || [];
      this.loading = false;
    }).catch((err: Error) => {
      this.errors.push(err);
      this.loading = false;
    });
  },
  data() {
    const providerDetails = PROVIDER_TYPES.find(p => p.id === this.provider) || { credentialsRequired: false };

    return {
      loading:            true,
      fvFormRuleSets:          [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.name', rules: ['required'] },
      ],
      allNamespaces:         [],
      shouldCreateSecret:    true,
      needCredential:     providerDetails?.credentialsRequired,
      toggler:            false
    };
  },
  computed: {
    ...mapGetters(['namespaces']),
    hideSensitiveData() {
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },
    modeOptions() {
      return [{
        label: this.t('capi.provider.secret.reuse'),
        value: false,
      }, {
        label: this.t('capi.provider.secret.create'),
        value: true,
      }];
    },
    showForm() {
      return !!this.value.spec.credentials.rancherCloudCredential || !this.needCredential;
    },
  },
  methods:  {
    initSpecs() {
      if ( !this.value.spec ) {
        set(this.value, 'spec', clone(defaultSpec));
      }
      if ( this.provider !== 'custom') {
        set(this.value.spec, 'name', this.provider); // Defines the provider kind to provision.
      }
      set(this.value.spec.configSecret, 'name', this.generateName(this.provider)); // Defines the name of the secret that will be created or adjusted based on the content of the spec.features and spec.variables.
    },
    generateName(name: string) {
      return name ? `${ name }-credentials-${ randomStr(5).toLowerCase() }` : undefined;
    },
    async getNamespaces() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);

      return await this.$store.dispatch(`${ inStore }/findAll`, { type: NAMESPACE });
    },

    async saveOverride() {
      if ( this.errors ) {
        clear(this.errors);
      }
      try {
        await this.value.save();

        return this.done();
      } catch (err) {
        this.errors.push(err);
      }
    },
    cancelCredential() {
      if ( this.$refs.cruresource ) {
        this.$refs.cruresource.emitOrRoute();
      }
    }
  }
});
</script>

<template>
  <Loading v-if="loading" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="true"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    class="provider"
    component-testid="capi-provider-create"
    @done="done"
    @finish="saveOverride"
    @cancel="done"
    @error="fvUnreportedValidationErrors"
  >
    <NameNsDescription
      v-if="!isView"
      v-model="value"
      :mode="mode"
      :namespaced="true"
      :namespace-options="allNamespaces"
      name-label="capi.provider.name.label"
      name-placeholder="capi.provider.name.placeholder"
      description-label="capi.provider.description.label"
      description-placeholder="capi.provider.description.placeholder"
      :rules="{name:fvGetAndReportPathRules('metadata.name')}"
    />
    <div v-if="provider === 'custom'" class="col span-3 mb-40">
      <LabeledInput
        v-model="value.spec.name"
        :mode="mode"
        label-key="capi.provider.type.label"
        required
        :rules="fvGetAndReportPathRules('spec.name')"
      />
    </div>
    <div v-if="needCredential" class="mb-40" />
    <h2 class="mb-20">
      <t k="capi.provider.secret.title" />
    </h2>
    <RadioGroup
      v-model="shouldCreateSecret"
      name="shouldCreateSecret"
      :mode="mode"
      :options="modeOptions"
      class="mb-40"
    />
    <div v-if="shouldCreateSecret">
      <SelectCredential
        v-if="needCredential"
        v-model="value.spec.credentials.rancherCloudCredential"
        :mode="mode"
        :provider="provider"
        :cancel="cancelCredential"
        :showing-form="showForm"
        class="mb-40"
      />
      <h3 class="mb-20">
        <t k="capi.provider.features.title" />
      </h3>
      <div class="mb-40">
        <Checkbox
          v-model="value.spec.features.clusterResourceSet"
          :label="t('capi.provider.features.clusterResourceSet')"
        />
        <Checkbox
          v-model="value.spec.features.clusterTopology"
          :label="t('capi.provider.features.clusterTopology')"
        />
        <Checkbox
          v-model="value.spec.features.machinePool"
          :label="t('capi.provider.features.machinePool')"
        />
      </div>
      <h3>
        <t k="capi.provider.variables.title" />
      </h3>
      <KeyValue
        v-model="value.spec.variables"
        :add-label="t('capi.provider.variables.add')"
        :mode="mode"
        :read-allowed="false"
        :value-can-be-empty="false"
      />
    </div>
  </CruResource>
</template>
