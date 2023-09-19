import { CAPI_PRODUCT_NAME } from '../types/capi';

export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    // weightType,
    virtualType,
    // headers,
  } = $plugin.DSL(store, CAPI_PRODUCT_NAME);

  product({
    inStore:             'management',
    icon:                'gear',
    weight:  100,
    to:                  {
      name:   `${ CAPI_PRODUCT_NAME }-c-cluster-dashboard`,
      params: {
        product: CAPI_PRODUCT_NAME,
        cluster: 'local'
      }
    }
  });

  virtualType({
    label:       'CAPI Turtles',
    icon:        'gear',
    name:        'capi-dashboard',
    namespaced:  false,
    weight:      99,
    route:                  {
      name:   `${ CAPI_PRODUCT_NAME }-c-cluster-dashboard`,
      params: {
        product: CAPI_PRODUCT_NAME,
        cluster: 'local'
      }
    },
    overview: true
  });

  basicType(['capi-dashboard']);
}
