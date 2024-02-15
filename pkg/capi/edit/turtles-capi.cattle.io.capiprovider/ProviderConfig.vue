<script lang='ts'>
import Vue, { VueConstructor } from 'vue';
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import { clear } from '@shell/utils/array';
import { NAMESPACE, SECRET } from '@shell/config/types';
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import SelectCredential from '@shell/edit/provisioning.cattle.io.cluster/SelectCredential.vue';
import FormValidation from '@shell/mixins/form-validation';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { randomStr } from '@shell/utils/string';
import { clone, set } from '@shell/utils/object';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Banner from '@components/Banner/Banner.vue';
import { _EDIT, _CREATE } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import { PROVIDER_TYPES, RANCHER_TURTLES_SYSTEM_NAMESPACE, RANCHER_TURTLES_SYSTEM_NAME, Provider } from '../../types/capi';
import { providerVersionValidator, urlValidator } from '../../util/validators';

const defaultSpec = {
  name:         '',
  type:         'infrastructure',
  configSecret: { name: '' },
  credentials:  { rancherCloudCredential: '' },
  features:     {
    clusterResourceSet: true,
    clusterTopology:    true,
    machinePool:        true,
  },
  variables: {}
};
const customProviderSpec = {
  name:         '',
  type:         'infrastructure',
  configSecret: { name: '' },
  credentials:  { rancherCloudCredential: '' },
  fetchConfig:  { url: '' },
  version:      '',
  features:     {
    clusterResourceSet: true,
    clusterTopology:    true,
    machinePool:        true,
  },
  variables: {}
};

const providerTypes = ['infrastructure', 'bootstrap', 'controlPlane'];

interface Secret {
  metadata: {
    name: string,
    namespace: string
  }
}
interface Hash {
  namespaces: [],
  coreProviderSecret: Secret[]
}

export default (Vue as VueConstructor<
  Vue & InstanceType<typeof CreateEditView>
>).extend({
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    SelectCredential,
    Checkbox,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Banner
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
    this.getDependencies().then((hash: Hash) => {
      this.allNamespaces = hash.namespaces || [];
      this.coreProviderSecret = hash.coreProviderSecret.filter((v: Secret) => v.metadata.namespace === RANCHER_TURTLES_SYSTEM_NAMESPACE && v.metadata.name === RANCHER_TURTLES_SYSTEM_NAME )[0] || {};
      this.initSpecs();
      this.loading = false;
    }).catch((err: Error) => {
      this.errors.push(err);
      this.initSpecs();
      this.loading = false;
    });
  },
  data() {
    const providerDetails: Provider = PROVIDER_TYPES.find(p => p.id === this.provider) || {
      needCredentials: false, requireCredentials: false, disabled: false, id: '0'
    };

    return {
      loading:            true,
      fvFormRuleSets:          [
        { path: 'metadata.name', rules: ['required'] },
        { path: 'spec.name', rules: ['required'] },
        { path: 'spec.version', rules: ['version'] },
        { path: 'spec.fetchConfig.url', rules: ['required', 'url'] },
      ],
      allNamespaces:         [],
      needCredential:     providerDetails?.needCredentials || false,
      requireCredentials: providerDetails?.requireCredentials || false,
      typeOptions:        providerTypes
    };
  },
  computed: {
    ...mapGetters(['namespaces']),
    fvExtraRules() {
      return {
        version: providerVersionValidator(this.$store.getters['i18n/t'], this.isCustom),
        url:     urlValidator(this.$store.getters['i18n/t'])
      };
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
    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
    hasFeatures() {
      return !!this.value?.spec?.features;
    },
    hasVariables() {
      return !!this.value?.spec?.features;
    },
    isCustom() {
      return this.provider === 'custom';
    },
    shouldShowBanner() {
      return this.isEdit && (this.hasFeatures || this.hasVariables);
    }
  },
  methods:  {
    initSpecs() {
      if ( !this.value.spec ) {
        if ( this.provider !== 'custom') {
          set(this.value, 'spec', clone(defaultSpec));
          set(this.value.spec, 'name', this.provider); // Defines the provider kind to provision.
        } else {
          set(this.value, 'spec', clone(customProviderSpec));
        }
      }
      if (!this.value.spec.configSecret.name) {
        set(this.value.spec.configSecret, 'name', this.generateName(this.provider)); // Defines the name of the secret that will be created or adjusted based on the content of the spec.features and spec.variables.
      }
    },
    generateName(name: string) {
      return name ? `${ name }-credentials-${ randomStr(5).toLowerCase() }` : undefined;
    },
    async getDependencies() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const { $store } = this;
      const hashPromises = {
        namespaces:         $store.dispatch(`${ inStore }/findAll`, { type: NAMESPACE }),
        coreProviderSecret: $store.dispatch(`management/findAll`, { type: SECRET })
      };

      return await allHash(hashPromises);
    },

    async saveOverride(btnCb: Function) {
      if ( this.errors ) {
        clear(this.errors);
      }
      try {
        await this.value.save();

        return this.done();
      } catch (err) {
        this.errors.push(err);
        btnCb(false);
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
    :validation-passed="fvFormIsValid"
    :resource="value"
    :errors="fvUnreportedValidationErrors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    class="provider"
    component-testid="capi-provider-create"
    @done="done"
    @finish="saveOverride"
    @cancel="done"
    @error="e=>errors=e"
  >
    <NameNsDescription
      v-model="value"
      :mode="mode"
      :namespaced="true"
      :namespace-options="allNamespaces"
      :namespace-new-allowed="true"
      name-label="capi.provider.name.label"
      name-placeholder="capi.provider.name.placeholder"
      description-label="capi.provider.description.label"
      description-placeholder="capi.provider.description.placeholder"
      :rules="{name:fvGetAndReportPathRules('metadata.name')}"
    />
    <div v-if="isCustom" class="row mb-40">
      <div
        class="col span-3"
      >
        <LabeledInput
          v-model="value.spec.name"
          :mode="mode"
          label-key="capi.provider.label"
          required
          :rules="fvGetAndReportPathRules('spec.name')"
        />
      </div>
      <div
        class="col span-3"
      >
        <LabeledSelect
          v-model="value.spec.type"
          :mode="mode"
          :options="typeOptions"
          label-key="capi.provider.type.label"
          required
        />
      </div>
      <div
        class="col span-3"
      >
        <LabeledInput
          v-model="value.spec.version"
          :mode="mode"
          label-key="capi.provider.version.label"
          required
          :rules="fvGetAndReportPathRules('spec.version')"
        />
      </div>
      <div
        class="col span-3"
      >
        <LabeledInput
          v-model="value.spec.fetchConfig.url"
          :mode="mode"
          label-key="capi.provider.fetchConfigURL.label"
          required
          :rules="fvGetAndReportPathRules('spec.fetchConfig.url')"
        />
      </div>
    </div>
    <div v-if="needCredential" class="mb-40" />
    <h2 v-if="hasFeatures || hasVariables" class="mb-20">
      <t k="capi.provider.secret.title" />
    </h2>
    <SelectCredential
      v-if="needCredential"
      v-model="value.spec.credentials.rancherCloudCredential"
      :mode="mode"
      :provider="provider"
      :cancel="cancelCredential"
      :showing-form="showForm"
      class="mb-40"
    />
    <Banner
      v-if="shouldShowBanner"
      color="info"
    >
      {{ t('capi.provider.banner') }}
    </Banner>
    <div v-if="hasFeatures" class="mb-40">
      <h3 class="mb-20">
        <t k="capi.provider.features.title" />
      </h3>
      <Checkbox
        v-model="value.spec.features.clusterResourceSet"
        :mode="mode"
        :label="t('capi.provider.features.clusterResourceSet')"
      />
      <Checkbox
        v-model="value.spec.features.clusterTopology"
        :mode="mode"
        :label="t('capi.provider.features.clusterTopology')"
      />
      <Checkbox
        v-model="value.spec.features.machinePool"
        :mode="mode"
        :label="t('capi.provider.features.machinePool')"
      />
    </div>
    <div v-if="hasVariables">
      <h3>
        <t k="capi.provider.variables.title" />
      </h3>
      <KeyValue
        v-model="value.spec.variables"
        :add-label="t('capi.provider.variables.add')"
        :mode="mode"
        :read-allowed="false"
        :value-can-be-empty="true"
      />
    </div>
  </CruResource>
</template>
