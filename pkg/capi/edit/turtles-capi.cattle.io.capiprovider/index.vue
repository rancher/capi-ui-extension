<script lang="ts">
import { defineComponent } from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import SelectIconGrid from '@shell/components/SelectIconGrid.vue';
import { SUB_TYPE } from '@shell/config/query-params';
import { PROVIDER_TYPES } from '../../types/capi';
import ProviderConfig from './ProviderConfig.vue';
import { set } from '@shell/utils/object';

interface ProviderType {
  id: string,
  label: string,
  description: string,
  icon: HTMLImageElement
  disabled: boolean,
}
type Route = {
  query: {[index: string]:any},
};

export default defineComponent({
  name: 'CreateProvider',

  components: {
    CruResource,
    SelectIconGrid,
    ProviderConfig
  },

  mixins: [CreateEditView],
  emits:['set-subtype', 'update:value'],

  props: {

    value: {
      type:    Object,
      default: null,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'capi-provider-create'
    }
  },
  beforeMount() {
    if ( this.value?.spec?.name) {
      this.selectType(this.value.spec.name);
    }
  },

  data() {
    const route = this.$route as Route;
    const subType: string | null = route?.query[SUB_TYPE] || null;

    return { subType };
  },

  computed: {
    subTypes() {
      const out: ProviderType[] = [];
      const getters = this.$store.getters;

      PROVIDER_TYPES?.forEach((provider) => {
        addType(provider.id, provider.disabled);
      });

      return out;

      function addType(id: string, disabled = false) {
        const label = getters['i18n/withFallback'](`cluster.provider."${ id }"`, null, id);
        const description = getters['i18n/withFallback'](`cluster.providerDescription."${ id }"`, null, '');
        let icon;

        try {
          icon = require(`~shell/assets/images/providers/${ id }.svg`);
        } catch (e) {
          try {
            icon = require(`../../assets/images/providers/${ id }.svg`);
          } catch (e) {
            icon = require('~shell/assets/images/generic-driver.svg');
          }
        }

        const providerType: ProviderType = {
          id,
          label,
          description,
          icon,
          disabled
        };

        out.push(providerType);
      }
    }
  },

  methods: {
    set,
    clickedType(obj: ProviderType) {
      const id = obj.id;

      this.$router?.applyQuery({ [SUB_TYPE]: id });
      this.selectType(id);
    },

    selectType(type: string) {
      this.subType = type;
      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));
    },
  },
});
</script>

<template>
  <CruResource               
    :mode="mode"
    :validation-passed="true"
    :selected-subtype="subType"
    :resource="value"
    :errors="errors"
    :subtypes="subTypes"
    :cancel-event="true"
    :prevent-enter-submit="true"
    class="create-cluster"
    @finish="save"
    @cancel="done"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <template #subtypes>
      <div
        class="mb-20"
        style="width: 100%;"
      >
        <SelectIconGrid
          :rows="subTypes"
          key-field="id"
          name-field="label"
          side-label-field="tag"
          @clicked="clickedType"
        />
      </div>
    </template>
    <ProviderConfig
      v-if="subType"
      :value="value"
      :mode="mode"
      :provider="subType"
      @update:value="set(value, $event.k, $event.val)"
    />

    <template
      v-if="subType"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang='scss'>
  .grouped-type {
    position: relative;
  }

  .rke-switch {
    margin-top: -10px;
    position: absolute;
    right: 0;
  }
</style>
