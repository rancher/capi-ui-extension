<script lang="ts">
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import CruResource from '@shell/components/CruResource';
import SelectIconGrid from '@shell/components/SelectIconGrid';

import { ClusterClass, CAPI } from '@pkg/capi/types/capi';
import ClusterConfig from './ClusterConfig';
import ClusterClassCard from './../components/ClusterClassCard/index';

export default {
  name:       'SelectClusterClass',
  components: {
    CruResource,
    Loading,
    ClusterConfig,
    SelectIconGrid,
    ClusterClassCard
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
    provider: {
      type:     String,
      required: true,
    }
  },
  async fetch() {
    this.clusterClasses = await this.getClusterClasses() || [];
  },
  data() {
    const clusterClassObj = null;

    return { clusterClassObj, clusterClasses: [] };
  },
  computed: {
    options() {
      const out: string[] = [];
      const getters = this.$store.getters;

      this.clusterClasses.forEach((obj: ClusterClass) => {
        addType(obj?.metadata?.name);
      });

      return out;

      function addType(id: String, disabled = false, iconClass = undefined) {
        const label = getters['i18n/withFallback'](`cluster.clusterClass."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        const tag = '';
        const icon = require('~shell/assets/images/generic-driver.svg');

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
    shouldShowOptions() {
      return this.options.length > 0 && !this.clusterClassObj;
    },
    sample() {
      return this.options[0];
    }
  },
  methods: {
    async getClusterClasses() {
      const allClusterClasses: ClusterClass[] = await this.$store.dispatch('management/findAll', { type: CAPI.CLUSTER_CLASS });

      return allClusterClasses.filter(cc => cc.spec.infrastructure.ref.name === this.provider);
    },
    cancel() {
      this.$router.push({
        name:   'c-cluster-manager-capi',
        params: {},
      });
    },
    clickedType(obj: Object) {
      this.clusterClassObj = this.clusterClasses.find(x => x.metadata.name === obj.id);
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
      :resource="value"
      :errors="errors"
      :cancel-event="true"
      :prevent-enter-submit="true"
      class="create-cluster"
      @finish="save"
      @cancel="cancel"
      @error="e=>errors = e"
    >
      <div v-if="shouldShowOptions">
        <div
          class="mb-20"
          style="width: 100%;"
        >
          <!-- <SelectIconGrid
            :rows="options"
            key-field="id"
            name-field="label"
            side-label-field="tag"
            @clicked="clickedType"
          /> -->
          <ClusterClassCard
            :value="sample"
          />
        </div>
      </div>

      <ClusterConfig
        v-if="clusterClassObj"
        v-model="value"
        :initial-value="initialValue"
        :live-value="liveValue"
        :mode="mode"
        :provider="provider"
        :cluster-class-obj="clusterClassObj"
      />

      <template
        v-if="clusterClassObj"
        #form-footer
      >
        <div><!-- Hide the outer footer --></div>
      </template>
    </CruResource>
  </div>
</template>
