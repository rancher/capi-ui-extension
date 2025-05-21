export const CAPI_PRODUCT_NAME = 'capi-turtles';

export const QUERY_PARAMS = { CLASS: 'class' };

export const BLANK_CLUSTER = '_';

export const LABELS = { AUTO_IMPORT: 'cluster-api.cattle.io/rancher-auto-import' };

export const ANNOTATIONS = {
  // clusterclass variable styling
  GROUP:        'turtles-capi.cattle.io/group', // group in a sub-section
  SECTION:      'turtles-capi.cattle.io/section', // add to existing top-level section or insert new one
  HIGHLIGHT:    'turtles-capi.cattle.io/highlight', // show description more prominently and with info, warning, or error icon + colors
  LABEL:        'turtles-capi.cattle.io/label', // human-readable label

  TOGGLED_BY:   'turtles-capi.cattle.io/toggled-by', // gate visibility on a boolean var - template responsible for grouping
  TOGGLE_GROUP: 'turtles-capi.cattle.io/toggle-group', // use a boolean to toggle the visibility of a sub-section

  SEARCH_TYPE: 'turtles-capi.cattle.io/type' // k8s resource type to search for and populate labeledselect w/

};

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
    name: 'aws', type: 'infrastructure', disabled: false, credential: 'aws', credentialRequired: true
  },
  {
    name: 'azure', type: 'infrastructure', disabled: false, credential: 'azure', credentialRequired: false
  },
  {
    name: 'digitalocean', type: 'infrastructure', disabled: false, credential: 'digitalocean', credentialRequired: true
  },
  {
    name: 'docker', type: 'infrastructure', disabled: false
  },
  {
    name: 'gcp', type: 'infrastructure', disabled: false, credential: 'gcp', credentialRequired: true
  },
  {
    name: 'vsphere', type: 'infrastructure', disabled: false, credential: 'vmwarevsphere', credentialRequired: true
  },
  {
    name: 'rke2', type: 'bootstrap', disabled: false
  },
  {
    name: 'rke2', type: 'controlPlane', disabled: false
  },
  {
    name: 'kubeadm', type: 'bootstrap', disabled: false
  },
  {
    name: 'kubeadm', type: 'controlPlane', disabled: false
  },
  {
    name: 'custom', type: 'custom', disabled: false
  },
];
