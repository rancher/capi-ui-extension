import { CAPI_PRODUCT_NAME } from '../types/capi';
import Dashboard from '../pages/index.vue';

const BLANK_CLUSTER = '_';

const routes = [
  {
    name:      `${ CAPI_PRODUCT_NAME }-c-cluster-dashboard`,
    path:      `/${ CAPI_PRODUCT_NAME }/c/:cluster/dashboard`,
    component: Dashboard,
    meta:      {
      product: CAPI_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  },
];

export default routes;
