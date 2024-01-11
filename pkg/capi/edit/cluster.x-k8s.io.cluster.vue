<script lang="ts">
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import CruResource from '@shell/components/CruResource';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { SUB_TYPE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

import { DEFAULT_WORKSPACE } from '@shell/config/types';

import { CAPI, InfrastructureProvider } from '@pkg/capi/types/capi';

import ClusterClassSelector from './ClusterClassSelector';
import ClusterConfig from './ClusterConfig';

export default {
  name:       'CreateCluster',
  components: {
    CruResource,
    Loading,
    ClusterClassSelector,
    SelectIconGrid,
    ClusterConfig
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:    Object,
      default: null,
    },
    componentTestid: {
      type:    String,
      default: 'capi-provider-create'
    }
  },
  async fetch() {
    this.capiProviders = await this.getProviders();

    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }
    if ( !this.value.id ) {
      if ( !this.value.metadata ) {
        set(this.value, 'metadata', {});
      }

      set(this.value.metadata, 'namespace', DEFAULT_WORKSPACE);
    }
  },
  data() {
    const subType = this.$route.query[SUB_TYPE] || null;

    return { subType, capiProviders: [] };
  },
  computed: {
    capiSubTypes() {
      const out = [];
      const getters = this.$store.getters;

      this.capiProviders.forEach((obj: InfrastructureProvider) => {
        addType(obj?.metadata?.name);
      });

      return out;

      function addType(id: String, disabled = false, iconClass = undefined) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';

        let icon: HTMLImageElement;

        try {
          icon = require(`~shell/assets/images/providers/${ id }.svg`);
        } catch (e) {}

        if (icon) {
          iconClass = undefined;
        } else if (!iconClass) {
          icon = require('~shell/assets/images/generic-driver.svg');
        }

        const subtype = {
          id,
          label,
          description,
          icon,
          iconClass,
          disabled,
          tag
        };

        out.push(subtype);
      }
    },
  },
  methods: {
    async getProviders() {
      const allProviders = await this.$store.dispatch('management/findAll', { type: CAPI.PROVIDER });
      const clusterClasses = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });
      const providersFromCC = new Set(clusterClasses.map(cc => cc.spec.infrastructure.ref.name));

      const filtered = allProviders.filter(p => providersFromCC.has(p.metadata.name)) || [];

      return filtered;
    },
    cancel() {
      this.$router.push({
        name:   'c-cluster-manager-capi',
        params: {},
      });
    },
    selectType(type: String, fetch = true) {
      this.subType = type;
      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));

      if ( fetch ) {
        this.$fetch();
      }
    },
    clickedType(obj: Object) {
      this.providerInfo = obj;
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <CruResource
      :mode="mode"
      :validation-passed="true"
      :selected-subtype="subType"
      :resource="value"
      :errors="errors"
      :subtypes="capiSubTypes"
      :cancel-event="true"
      :prevent-enter-submit="true"
      class="create-cluster"
      @finish="save"
      @cancel="cancel"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <template #capisubtypes>
        <div
          class="mb-20"
          style="width: 100%;"
        >
          <SelectIconGrid
            :rows="capiSubTypes"
            key-field="id"
            name-field="label"
            side-label-field="tag"
            @clicked="clickedType"
          />
        </div>
      </template>
      <ClusterConfig
        v-if="subType"
        v-model="value"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :provider="subType"
      />

      <!-- <ClusterClassSelector
        v-if="subType"
        v-model="value"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :provider="subType"
      /> -->

      <template
        v-if="subType"
        #form-footer
      >
        <div><!-- Hide the outer footer --></div>
      </template>
    </CruResource>
  </div>
</template>
