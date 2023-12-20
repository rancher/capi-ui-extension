import { CAPI as RANCHER_CAPI } from '@shell/config/types';
import { CAPI as TURTLES_CAPI } from '../types/capi';

const CLUSTER_MGMT_PRODUCT = 'manager';

export function init($plugin: any, store: any) {
  const {
    basicType,
    weightType,
    weightGroup,
    virtualType,
    // headers,
  } = $plugin.DSL(store, CLUSTER_MGMT_PRODUCT);

  virtualType({
    label:       'CAPI Turtles',
    icon:        'gear',
    name:        'capi-dashboard',
    namespaced:  false,
    weight:      99,
    route:                  {
      name:   `c-cluster-${ CLUSTER_MGMT_PRODUCT }-capi`,
      params: { cluster: '_' }
    },
    overview: true,
    exact:    true,
  });

  // Interestingly, types can only appear in one place, so by adding machine deployment
  // and others here, they will no longer show up in the Advanced section, which is
  // quite nice for this use case
  basicType([
    'capi-dashboard',
    RANCHER_CAPI.CAPI_CLUSTER,
    TURTLES_CAPI.CLUSTER_CLASS,
    TURTLES_CAPI.PROVIDER,
    // keep this page hidden under 'advanced' still as it may fail to load in Rancher <=2.8.0, see https://github.com/rancher/dashboard/issues/9973
    // RANCHER_CAPI.MACHINE,
    RANCHER_CAPI.MACHINE_SET,
    RANCHER_CAPI.MACHINE_DEPLOYMENT,
  ], 'CAPITurtles');

  weightType(RANCHER_CAPI.CAPI_CLUSTER, 10, true);

  // Ensure CAPI group appears before the Advanced group
  weightGroup('CAPITurtles', 10, true);
}

export const API = {
  PROVIDERS: 'operator.cluster.x-k8s.io.infrastructureprovider',
  CLUSTER_CLASSES: 'cluster.x-k8s.io.clusterclass'
};
