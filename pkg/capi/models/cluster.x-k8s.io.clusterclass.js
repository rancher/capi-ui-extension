import SteveModel from '@shell/plugins/steve/steve-class';
import { CAPI, MANAGEMENT, LOCAL_CLUSTER } from '@shell/config/types';
import { BLANK_CLUSTER, QUERY_PARAMS } from '../types/capi';

export default class ClusterClass extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    out.unshift({
      action:   'goToCreateCluster',
      label:   this.t('action.createCluster'),
      icon:     'icon icon-plus',
      enabled:  true
    });

    return out;
  }

  goToCreateCluster() {
    const escapedID = escape(this.id);
    const location = {
      name:   'c-cluster-product-resource-create',
      params: {
        cluster:  BLANK_CLUSTER,
        product:  'manager',
        resource: CAPI.CAPI_CLUSTER
      },
      query: { [QUERY_PARAMS.CLASS]: escapedID }
    };

    this.currentRouter().push(location);
  }

  saveYaml(yaml) {
    const localCluster = this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, LOCAL_CLUSTER);
    return localCluster.doAction('apply', { yaml });
  }
}
