<script lang="ts">
import Vue, { VueConstructor } from 'vue';
import { SUB_TYPE } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import type { Route } from 'vue-router';
import ClusterConfig from './ClusterConfig/index.vue';
import { CAPI, QUERY_PARAMS, ClusterClass } from './../types/capi';

export default (Vue as VueConstructor<
  Vue & InstanceType<typeof CreateEditView>
>).extend({
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
    this.getClusterClasses().then((cc: any[]) => {
      this.clusterClasses = cc;
      this.loading = false;
    }).catch((err: Error) => {
      this.errors.push(err);
      this.loading = false;
    });
  },
  data() {
    const route = this.$route as Route;
    const subType = route.query[SUB_TYPE] || null;
    const classFromURL = route.query[QUERY_PARAMS.CLASS];
    const curClass = this.value?.spec?.topology?.class;
    const curNs = this.value?.metadata?.namespace;
    const classFromValue = curNs && curClass ? escape(`${ curNs }/${ curClass }`) : null;
    const preselectedClass = classFromURL || classFromValue || null;

    return {
      subType, preselectedClass, capiProviders: [], clusterClasses: [] as any[], loading: true
    };
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
    }
  }
});
</script>

<template>
  <div>
    <Loading v-if="loading" />
    <div v-else>
      <ClusterConfig
        v-if="preselectedClass"
        v-model="value"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :preselected-class="preselectedClass"
        :cluster-classes="clusterClasses"
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
          v-model="value"
          :initial-value="initialValue"
          :live-value="liveValue"
          :mode="mode"
          :cluster-classes="clusterClasses"
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
