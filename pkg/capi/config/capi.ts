const CLUSTER_MGMT_PRODUCT = 'manager';

export function init($plugin: any, store: any) {
  const {
    basicType,
    // weightType,
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
    'cluster.x-k8s.io.machinedeployment',
    'cluster.x-k8s.io.machineset',
    'cluster.x-k8s.io.machine'
  ], 'CAPITurtles');

  // Ensure CAPI group appears before the Advanced group
  weightGroup('CAPITurtles', 10, true);
}
