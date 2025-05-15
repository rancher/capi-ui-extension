export const CAPI_PRODUCT_NAME = 'capi-turtles';

export const QUERY_PARAMS = { CLASS: 'class' };

export const BLANK_CLUSTER = '_';

export const LABELS = { AUTO_IMPORT: 'cluster-api.cattle.io/rancher-auto-import' };

export const RANCHER_TURTLES_SYSTEM_NAMESPACE = 'capi-system';
export const RANCHER_TURTLES_SYSTEM_NAME = 'capi-env-variables';

export const CAPI = {
  CLUSTER:       'cluster.x-k8s.io.cluster',
  CLUSTER_CLASS: 'cluster.x-k8s.io.clusterclass',
  PROVIDER:      'turtles-capi.cattle.io.capiprovider',
};

export const CP_VERSIONS = {
  KThreesControlPlaneTemplate:        ['k3s1', 'k3s2'],
  RKE2ControlPlaneTemplate:          ['rke2r1', 'rke2r2']
};

export const CREDENTIALS_UPDATE_REQUIRED = ['aks'];
export const CREDENTIALS_NOT_REQUIRED = ['docker'];

export const PROVIDER_TYPES = [
  {
    id: 'aws', disabled: false, credential: 'aws'
  },
  {
    id: 'azure', disabled: false, credential: 'azure'
  },
  {
    id: 'digitalocean', disabled: false, credential: 'digitalocean'
  },
  { id: 'docker', disabled: false },
  {
    id: 'gcp', disabled: false, credential: 'gcp'
  },
  {
    id: 'vsphere', disabled: false, credential: 'vmwarevsphere'
  },
  { id: 'custom', disabled: false },
];
