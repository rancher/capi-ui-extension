<script>
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
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

import { allHash } from '@shell/utils/promise';
import { PROVIDER_TYPES, RANCHER_TURTLES_SYSTEM_NAMESPACE, RANCHER_TURTLES_SYSTEM_NAME } from '../../types/capi';
import { providerNameValidator, providerVersionValidator, urlValidator } from '../../util/validators';

const defaultFeatures = {
  clusterResourceSet: true,
  clusterTopology:    true,
  machinePool:        true
};
const defaultVariables = {};
const defaultSpec = {
  name:         '',
  type:         'infrastructure',
  configSecret: { name: '' },
  credentials:  { rancherCloudCredentialNamespaceName: '' }
};
const customProviderSpec = {
  name:         '',
  type:         'infrastructure',
  configSecret: { name: '' },
  credentials:  { rancherCloudCredentialNamespaceName: '' },
  fetchConfig:  { url: '' },
};

const CATEGORIES = ['infrastructure', 'bootstrap', 'controlPlane', 'addon', 'ipam', 'runtimeextension', 'core'];

export default {
  name: 'ProviderConfig',

  components: {
    CruResource,
    Loading,
    NameNsDescription,
    SelectCredential,
    Checkbox,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Banner,
    ToggleSwitch
  },

  mixins: [CreateEditView, FormValidation],

  emits: ['update:value'],

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
    },
    category: {
      type:     String,
      default: 'infrastructure',
    }
  },

  beforeMount() {
    this.getDependencies().then((hash) => {
      this.allNamespaces = hash.namespaces || [];
      this.coreProviderSecret = hash.coreProviderSecret || {};
      this.initSpecs();
      this.loading = false;
    }).catch((err) => {
      this.errors.push(err);
      this.initSpecs();
      this.loading = false;
    });
  },

  data() {
    const name = this.provider;
    const providerDetails = PROVIDER_TYPES.find((p) => p.name === name) || { disabled: false, id: '0' };

    return {
      loading:            true,
      fvFormRuleSets:          [
        { path: 'metadata.name', rules: ['name'] },
        { path: 'spec.name', rules: ['required'] },
        { path: 'spec.version', rules: ['version'] },
        { path: 'spec.fetchConfig.url', rules: ['url'] },
      ],
      allNamespaces:         [],
      credentialComponent:     providerDetails?.credential,
      useCredential:       !!providerDetails?.credentialRequired || (this.mode === _EDIT && !!this.value?.spec?.credentials?.rancherCloudCredentialNamespaceName),
      credentialRequired:  providerDetails?.credentialRequired
    };
  },

  watch: {
    // if a user toggles off credentials, clear them from the spec
    useCredential(neu) {
      if (!neu && !this.credentialRequired) {
        this.value.spec.credentials.rancherCloudCredentialNamespaceName = '';
      }
    }
  },

  computed: {
    ...mapGetters(['namespaces']),

    fvExtraRules() {
      return {
        name:    providerNameValidator(this.$store.getters['i18n/t']),
        version: providerVersionValidator(this.$store.getters['i18n/t']),
        url:     urlValidator(this.$store.getters['i18n/t'])
      };
    },

    typeOptions() {
      return CATEGORIES.map((type) => {
        return { label: this.t(`capi.provider.type.${ type }.label`), value: type };
      });
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    hasFeatures() {
      return !!this.value?.spec?.features;
    },

    hasVariables() {
      return !!this.value?.spec?.variables;
    },

    isCustom() {
      return this.provider === 'custom';
    },

    shouldShowBanner() {
      return this.isEdit && (this.hasFeatures || this.hasVariables);
    },

    waitingForCredential() {
      return this.credentialComponent && !this.value.spec.credentials?.rancherCloudCredentialNamespaceName;
    },
    rancherCloudCredentialNamespaceName() {
      return this.value.spec?.credentials?.rancherCloudCredentialNamespaceName || '';
    },

    providerDisplayName() {
      return this.t(`capi.provider.providerDisplayNames.${ this.provider }`) || this.provider;
    }
  },

  methods:  {
    initSpecs() {
      if ( !this.value.spec ) {
        const defaultsFromCoreProvider = this.getSpecFromCoreSecret();

        if ( this.provider !== 'custom') {
          set(this.value, 'spec', { ...clone(defaultSpec), ...defaultsFromCoreProvider });
          set(this.value.spec, 'name', this.provider); // Defines the provider kind to provision.
          set(this.value.spec, 'type', this.category);
        } else {
          set(this.value, 'spec', { ...clone(customProviderSpec), ...defaultsFromCoreProvider });
        }
      }
      if (this.isCreate && !this.value.spec.configSecret?.name) {
        set(this.value.spec.configSecret, 'name', this.generateName(this.provider)); // Defines the name of the secret that will be created or adjusted based on the content of the spec.features and spec.variables.
      }
    },

    getSpecFromCoreSecret() {
      const coreProviderSecretData = this.coreProviderSecret?.data;

      if (coreProviderSecretData) {
        const FEATURES_KEYS = ['EXP_CLUSTER_RESOURCE_SET', 'CLUSTER_TOPOLOGY', 'EXP_MACHINE_POOL'];

        const variables = clone(coreProviderSecretData);

        FEATURES_KEYS.forEach((key) => {
          delete variables[key];
        });

        return {
          features: {
            clusterResourceSet: coreProviderSecretData.EXP_CLUSTER_RESOURCE_SET === 'dHJ1ZQ==',
            clusterTopology:    coreProviderSecretData.CLUSTER_TOPOLOGY === 'dHJ1ZQ==',
            machinePool:        coreProviderSecretData.EXP_MACHINE_POOL === 'dHJ1ZQ=='
          },
          variables
        };
      }

      return {
        features:  clone(defaultFeatures),
        variables: clone(defaultVariables)
      };
    },

    generateName(name) {
      return name ? `${ name }-credentials-${ randomStr(5).toLowerCase() }` : undefined;
    },

    async getDependencies() {
      const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const { $store } = this;
      const hashPromises = {
        namespaces:         $store.dispatch(`${ inStore }/findAll`, { type: NAMESPACE }),
        coreProviderSecret: $store.dispatch(`management/find`, {
          type: SECRET, id: `${ RANCHER_TURTLES_SYSTEM_NAMESPACE }/${ RANCHER_TURTLES_SYSTEM_NAME }`, opt: { watch: false, force: true }
        } )
      };

      return await allHash(hashPromises);
    },

    async saveOverride(btnCb) {
      if ( this.errors ) {
        clear(this.errors);
      }
      if ( !this.useCredential && !this.value.spec?.credentials?.rancherCloudCredentialNamespaceName ) {
        this.value.spec.credentials = null;
      }
      if (this.value?.spec?.version === '') {
        delete this.value.spec.version;
      }
      try {
        await this.save(btnCb, null);
      } catch (err) {
        this.errors.push(err);
        btnCb(false);
      }
    },

    cancelCredential() {
      if (this.credentialRequired) {
        if ( this.$refs.providercruresource ) {
          this.$refs.providercruresource.emitOrRoute();
        }
      } else {
        this.useCredential = false;
      }
    }
  }
};
</script>

<template>
  <Loading v-if="loading" />
  <CruResource
    v-else
    ref="providercruresource"
    :can-yaml="false"
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
      :value="value"
      :mode="mode"
      :namespaced="true"
      :namespace-options="allNamespaces"
      :namespace-new-allowed="true"
      :create-namespace-override="true"
      name-label="capi.provider.name.label"
      name-placeholder="capi.provider.name.placeholder"
      description-label="capi.provider.description.label"
      description-placeholder="capi.provider.description.placeholder"
      :rules="{name:fvGetAndReportPathRules('metadata.name')}"
      @update:value="$emit('update:value', {k: 'metadata', val: $event.metadata })"
    />
    <div v-if="isCustom">
      <div class="row mb-20">
        <div
          class="col span-3"
        >
          <LabeledInput
            :value="value.spec.name"
            :mode="mode"
            label-key="capi.provider.label"
            placeholder-key="capi.provider.placeholder"
            required
            :rules="fvGetAndReportPathRules('spec.name')"
            @update:value="$emit('update:value', {k: 'spec.name', val: $event})"
          />
        </div>
        <div
          class="col span-3"
        >
          <LabeledSelect
            :value="value.spec.type"
            :mode="mode"
            :options="typeOptions"
            label-key="capi.provider.type.label"
            :disabled="isEdit"
            required
            @update:value="$emit('update:value', {k: 'spec.type', val: $event})"
          />
        </div>
        <div
          class="col span-3"
        >
          <LabeledInput
            :value="value.spec.version"
            :mode="mode"
            label-key="capi.provider.version.label"
            placeholder-key="capi.provider.version.placeholder"
            :tooltip="t('capi.provider.version.tooltip')"
            :rules="fvGetAndReportPathRules('spec.version')"
            @update:value="$emit('update:value', {k: 'spec.version', val: $event})"
          />
        </div>
      </div>
      <div class="row mb-40">
        <div
          class="col span-6"
        >
          <LabeledInput
            :value="value.spec.fetchConfig.url"
            :mode="mode"
            label-key="capi.provider.fetchConfigURL.label"
            placeholder-key="capi.provider.fetchConfigURL.placeholder"
            :rules="fvGetAndReportPathRules('spec.fetchConfig.url')"
            @update:value="$emit('update:value', {k: 'spec.fetchConfig.url', val: $event})"
          />
        </div>
      </div>
    </div>
    <h2
      v-if="hasFeatures || hasVariables"
      class="mb-20"
    >
      <t k="capi.provider.secret.title" />
    </h2>

    <div class="mb-20">
      <Banner
        v-if="shouldShowBanner"
        color="info"
      >
        {{ t('capi.provider.banner') }}
      </Banner>
      <div
        v-if="hasFeatures"
        class="mb-40"
      >
        <h3 class="mb-20">
          <t k="capi.provider.features.title" />
        </h3>
        <Checkbox
          :value="value.spec.features.clusterResourceSet"
          :mode="mode"
          :label="t('capi.provider.features.clusterResourceSet')"
          @update:value="$emit('update:value', {k: 'spec.features.clusterResourceSet', val: $event})"
        />
        <Checkbox
          v-model:value="value.spec.features.clusterTopology"
          :mode="mode"
          :label="t('capi.provider.features.clusterTopology')"
          @update:value="$emit('update:value', {k: 'spec.features.clusterTopology', val: $event})"
        />
        <Checkbox
          v-model:value="value.spec.features.machinePool"
          :mode="mode"
          :label="t('capi.provider.features.machinePool')"
          @update:value="$emit('update:value', {k: 'spec.features.machinePool', val: $event})"
        />
      </div>
      <div v-if="hasVariables">
        <h3>
          <t k="capi.provider.variables.title" />
        </h3>
        <KeyValue
          :value="value.spec.variables"
          :add-label="t('capi.provider.variables.add')"
          :mode="mode"
          :value-can-be-empty="true"
          :handle-base64="false"
          :value-trim="false"
          :add-allowed="true"
          :read-allowed="true"
          :parse-lines-from-file="true"
          @update:value="$emit('update:value', {k: 'spec.variables', val: $event})"
        />
      </div>
    </div>
    <div
      v-if="credentialComponent"
      class="credential-container"
    >
      <h3 class="mt-20">
        <t k="capi.provider.cloudCredential.title" />
      </h3>
      <div
        v-if="!credentialRequired"
        class="row mt-10"
      >
        <ToggleSwitch
          v-model:value="useCredential"
          name="credential-toggle"
          :on-label="t('capi.provider.cloudCredential.toggle', {provider: providerDisplayName})"
        />
      </div>

      <template v-if="useCredential">
        <SelectCredential
          :value="rancherCloudCredentialNamespaceName"
          :mode="mode"
          :provider="credentialComponent"
          :cancel="cancelCredential"
          :showing-form="false"
          class="credential"
          @update:value="$emit('update:value', {k: 'spec.credentials.rancherCloudCredentialNamespaceName', val: $event})"
        />
      </template>
    </div>
    <template
      v-if="waitingForCredential && useCredential"
      #form-footer
    >
      <div></div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
.credential-container {
  flex: 1 1 100%;
  display: flex;
  flex-direction: column;
}
</style>
