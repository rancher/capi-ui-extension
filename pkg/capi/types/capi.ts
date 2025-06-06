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
    name: 'aws', type: 'infrastructure', disabled: false, credential: 'aws', ns: 'capa-system', credentialRequired: true
  },
  {
    name: 'azure', type: 'infrastructure', disabled: false, credential: 'azure', ns: 'capz-system', credentialRequired: false
  },
  {
    name: 'digitalocean', type: 'infrastructure', disabled: false, credential: 'digitalocean', ns: 'capdo-system', credentialRequired: true
  },
  {
    name: 'docker', type: 'infrastructure', disabled: false, ns: 'capd-system'
  },
  {
    name: 'gcp', type: 'infrastructure', disabled: false, credential: 'gcp', ns: 'capg-system', credentialRequired: true
  },
  {
    name: 'vsphere', type: 'infrastructure', disabled: false, credential: 'vmwarevsphere', ns: 'capv-system', credentialRequired: true
  },
  {
    name: 'rke2', type: 'bootstrap', disabled: false, ns: 'rke2-bootstrap-system'
  },
  {
    name: 'rke2', type: 'controlPlane', disabled: false, ns: 'rke2-control-plane-system'
  },
  {
    name: 'kubeadm', type: 'bootstrap', disabled: false, ns: 'capi-kubeadm-bootstrap-system'
  },
  {
    name: 'kubeadm', type: 'controlPlane', disabled: false, ns: 'capi-kubeadm-control-plane-system'
  },
  {
    name: 'custom', type: 'custom', disabled: false
  },
];
