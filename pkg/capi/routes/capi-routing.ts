import Dashboard from '../pages/index.vue';

const BLANK_CLUSTER = '_';

const routes = [
  {
    name:      'c-cluster-manager-capi',
    path:      '/c/:cluster/manager/capi',
    component: Dashboard,
  },
];

export default routes;
