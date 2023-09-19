import { CAPI_PRODUCT_NAME } from '../types/capi';

const BLANK_CLUSTER = '_';

export const rootCapiRoute = () => ({
  name:    `${ CAPI_PRODUCT_NAME }-c-cluster-dashboard`,
  params: { product: CAPI_PRODUCT_NAME, cluster: 'local' },
  meta:   {
    product: CAPI_PRODUCT_NAME,
    cluster: 'local',
    pkg:     CAPI_PRODUCT_NAME
  },
});
