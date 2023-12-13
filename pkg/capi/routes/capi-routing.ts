import Dashboard from '../pages/index.vue';

const routes = [
  {
    name:      'c-cluster-manager-capi',
    path:      '/c/:cluster/manager/capi',
    component: Dashboard,
  },
];

export default routes;
