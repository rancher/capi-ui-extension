import SteveModel from '@shell/plugins/steve/steve-class';
import { CAPI } from '@shell/config/types';
import { BLANK_CLUSTER, QUERY_PARAMS } from '../types/capi';

export class infraProvider extends SteveModel {
  // get _availableActions() {
  //   const out = super._availableActions;

  //   out.unshift({
  //     action:  'goToCreateCluster',
  //     label:   'action.createCluster',
  //     icon:    'icon icon-copy',
  //     enabled: true
  //   });

  //   return out;
  // }

  canYaml() {
    return false;
  }

  // goToCreateCluster() {
  //   const escapedID = escape(this.id);
  //   const location = {
  //     name:   'c-cluster-manager-resource-create',
  //     params: {
  //       cluster:  BLANK_CLUSTER,
  //       resource: CAPI.CAPI_CLUSTER
  //     },
  //     query: { [QUERY_PARAMS.CLASS]: escapedID }
  //   };

  //   this.currentRouter().push(location);
  // }
}
