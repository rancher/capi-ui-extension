<script>
import { SUB_TYPE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import { CAPI, QUERY_PARAMS } from '../../types/capi';
import ClusterConfig from './ClusterConfig.vue';

export default {
  name:       'CreateCluster',
  components: {
    CruResource,
    Loading,
    ClusterConfig
  },
  emits:  ['update:value'],
  mixins: [CreateEditView],

  props: {
    value: {
      type:    Object,
      default: null,
    },
    componentTestid: {
      type:    String,
      default: 'capi-provider-create'
    },
    mode: {
      type:     String,
      required: true
    }
  },
  beforeMount() {
    if ( !this.value.spec ) {
      set(this.value, 'spec', {});
    }
    if ( !this.value.id ) {
      if ( !this.value.metadata ) {
        set(this.value, 'metadata', {});
      }
    }
    this.getClusterClasses().then((cc) => {
      this.clusterClasses = cc;
      this.loading = false;
    }).catch((err) => {
      this.errors.push(err);
      this.loading = false;
    });
  },
  data() {
    const route = this.$route;
    const subType = route.query[SUB_TYPE] || null;
    const classFromURL = route.query[QUERY_PARAMS.CLASS];
    const curClass = this.value?.spec?.topology?.class;
    const curNs = this.value?.metadata?.namespace;
    const classFromValue = curNs && curClass ? escape(`${ curNs }/${ curClass }`) : null;
    const preselectedClass = classFromURL || classFromValue || null;

    return {
      subType, preselectedClass, capiProviders: [], clusterClasses: [], loading: true
    };
  },
  methods: {
    set,
    async getClusterClasses() {
      const allClusterClasses = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });

      return allClusterClasses;
    },
    cancel() {
      this.$router.push({
        name:   'c-cluster-manager-capi',
        params: {},
      });
    }
  }
};
</script>

<template>
  <div>
    <Loading v-if="loading" />
    <div v-else>
      <ClusterConfig
        v-if="preselectedClass"
        :value="value"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :preselected-class="preselectedClass"
        :cluster-classes="clusterClasses"
        @update:value="set(value, $event.k, $event.val)"
      />
      <CruResource
        v-else
        :mode="mode"
        :validation-passed="true"
        :resource="value"
        :errors="errors"
        :cancel-event="true"
        :prevent-enter-submit="true"
        class="create-cluster"
        @finish="save"
        @cancel="cancel"
        @error="e=>errors = e"
      >
        <ClusterConfig
          :value="value"
          :initial-value="initialValue"
          :live-value="liveValue"
          :mode="mode"
          :cluster-classes="clusterClasses"
          @update:value="set(value, $event.k, $event.val)"
        />

        <template
          #form-footer
        >
          <div><!-- Hide the outer footer --></div>
        </template>
      </CruResource>
    </div>
  </div>
</template>
