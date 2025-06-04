<script>
import { mapGetters, mapActions } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource.vue';
import SelectIconGrid from '@shell/components/SelectIconGrid.vue';
import { SUB_TYPE } from '@shell/config/query-params';
import { PROVIDER_TYPE } from '../../config/query-params';
import { CAPI, PROVIDER_TYPES } from '../../types/capi';
import ProviderConfig from './ProviderConfig.vue';
import { set } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';

const SORT_GROUPS = {
  infrastructure:  1,
  bootstrap:       2,
  controlPlane:    3,
  custom:          4,
};

const CUSTOM = 'custom';

export default {
  name: 'CreateProvider',

  components: {
    CruResource,
    SelectIconGrid,
    ProviderConfig
  },

  mixins: [CreateEditView],
  emits:  ['set-subtype', 'update:value'],

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

  async beforeMount() {
    this.capiProviders = await this.$store.dispatch('management/findAll', { type: CAPI.PROVIDER });
    const name = this.value.spec?.name || this.value.metadata?.name;

    if (!name) {
      return;
    }
    if (this.value.spec?.fetchConfig && !this.subTypes.find(({ id }) => id === name)) {
      this.selectType(CUSTOM);
    } else {
      this.selectType(name);
    }
  },
  mounted() {
    console.log('trrr');
    this.$nextTick(() => {
      console.log('frrr');
      this.$store.dispatch('cru-resource/setCreateNamespace', true);
      // this.$refs.providercruresource.createNamespace = true;
    });
  },
  updated() {
    console.log('yaaa');
    this.$nextTick(() => {
      console.log('woooo');
      this.$store.dispatch('cru-resource/setCreateNamespace', true);
      // this.$refs.providercruresource.createNamespace = true;
    });
  },

  data() {
    return { subType: null, capiProviders: [] };
  },

  computed: {
    ...mapActions('cru-resource', ['setCreateNamespace']),
    subTypes() {
      const out = [];
      const getters = this.$store.getters;

      PROVIDER_TYPES?.forEach((provider) => {
        const id = this.makeProviderId(provider.name, provider.type);
        const disabled = provider.disabled || this.enabledProviderTypes.includes(id);

        addType(id, provider.name, provider.type, disabled);
      });

      return out;

      function addType(id, name, category, disabled = false) {
        const label = getters['i18n/withFallback'](`capi.provider.providerDisplayNames."${ name }"`, null, name);
        let icon;

        try {
          icon = require(`~shell/assets/images/providers/${ name }.svg`);
        } catch (e) {
          try {
            icon = require(`../../assets/images/providers/${ name }.svg`);
          } catch (e) {
            icon = require('~shell/assets/images/generic-driver.svg');
          }
        }

        const providerType = {
          id,
          name,
          category,
          label,
          icon,
          disabled
        };

        out.push(providerType);
      }
    },
    groupedSubTypes() {
      const out = {};

      for ( const provider of this.subTypes ) {
        const category = provider.category;

        let entry = out[category];

        if ( !entry ) {
          entry = {
            category,
            label: this.$store.getters['i18n/withFallback'](`capi.provider.type.${ category }.label`, null, category),
            items: [],
            sort:  SORT_GROUPS[category],
          };

          out[category] = entry;
        }

        entry.items.push(provider);
      }

      for ( const k in out ) {
        out[k].items = sortBy(out[k].items, 'label');
      }

      return sortBy(Object.values(out), 'sort');
    },

    enabledProviderTypes() {
      return this.capiProviders.reduce((existing, p) => {
        const name = !!p?.spec?.name ? p.spec.name : p?.metadata?.name;
        const type = p?.spec?.type;
        const id = this.makeProviderId(name, type);

        if (!existing.includes(id) && name !== CUSTOM) {
          existing.push(id);
        }

        return existing;
      }, []);
    }
  },

  methods: {
    set,
    makeProviderId(name, type) {
      return `${ name }-${ type }`;
    },
    clickedType(obj) {
      const name = obj.name;
      const category = obj.category;

      this.$router?.applyQuery({ [SUB_TYPE]: name, [PROVIDER_TYPE]: category });
      this.selectType(name, category);
    },

    selectType(name, category) {
      this.subType = name;
      this.category = category;

      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ name }"`, null, name));
    },
    cruResourceMounted() {
      this.$store.dispatch('cru-resource/setCreateNamespace', true);
    //   this.$refs.providercruresource.createNamespace = true;
    }
  },
};
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
    @create-namespace-changed="cruResourceMounted"
    @finish="save"
    @cancel="done"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <template #subtypes>
      <div
        v-for="(obj, i) in groupedSubTypes"
        :key="i"
        :class="{'mt-5': i === 0, 'mt-20': i !== 0 }"
        style="width: 100%;"
      >
        <h4>
          {{ obj.label }}
        </h4>
        <SelectIconGrid
          :rows="obj.items"
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
      :initial-value="initialValue"
      :live-value="liveValue"
      :mode="mode"
      :provider="subType"
      :category="category"
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
