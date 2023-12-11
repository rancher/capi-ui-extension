import Dashboard from '../pages/index.vue';
import blerg from '../pages/blerg.vue';

const routes = [
  {
    name:      'c-cluster-manager-capi',
    path:      '/c/:cluster/manager/capi',
    component: Dashboard,
  },
  {
    name:      'c-cluster-manager-capi-blerg',
    path:      '/c/:cluster/manager/capi/blerg',
    component: blerg,
  },
];

export default routes;
