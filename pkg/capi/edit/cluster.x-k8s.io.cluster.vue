<script lang="ts">
import { defineComponent } from 'vue';
import { SUB_TYPE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import ClusterConfig from './ClusterConfig.vue';
import { CAPI, QUERY_PARAMS, ClusterClass } from './../types/capi';

export default defineComponent({
  name:       'CreateCluster',
  components: {
    CruResource,
    Loading,
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
    this.clusterClasses = await this.getClusterClasses() || [];

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
    const preselectedClass = this.$route.query[QUERY_PARAMS.CLASS] || null;

    return {
      subType, preselectedClass, capiProviders: [], clusterClasses: null
    };
  },
  computed: {
    clusterClassOptions() {
      const out: string[] = [];
      const getters = this.$store.getters;

      this.clusterClasses?.forEach((obj: ClusterClass) => {
        addType(obj);
      });

      return out;

      function addType(obj: Object, disabled = false) {
        const id = obj?.metadata?.name;
        const label = getters['i18n/withFallback'](`cluster.clusterClass."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';

        const subtype = {
          id,
          obj,
          label,
          description,
          tag,
          selected: false
        };

        out.push(subtype);
      }
    },
  },
  methods: {
    async getClusterClasses() {
      const allClusterClasses: ClusterClass[] = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });

      return allClusterClasses;
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
});
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <ClusterConfig
      v-if="preselectedClass"
      v-model="value"
      :initial-value="initialValue"
      :live-value="liveValue"
      :mode="mode"
      :preselected-class="preselectedClass"
    />
    <CruResource
      v-else
      :mode="mode"
      :validation-passed="true"
      :selected-subtype="subType"
      :resource="value"
      :errors="errors"

      :cancel-event="true"
      :prevent-enter-submit="true"
      class="create-cluster"
      @finish="save"
      @cancel="cancel"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <ClusterConfig
        v-model="value"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
      />

      <template
        #form-footer
      >
        <div><!-- Hide the outer footer --></div>
      </template>
    </CruResource>
  </div>
</template>
