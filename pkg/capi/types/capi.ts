export const CAPI_PRODUCT_NAME = 'capi-turtles';

export const QUERY_PARAMS = { CLASS: 'class' };

export const BLANK_CLUSTER = '_';

export const LABELS = { AUTO_IMPORT: 'cluster-api.cattle.io/rancher-auto-import' };

export const CAPI = {
  CLUSTER_CLASS: 'cluster.x-k8s.io.clusterclass',
  PROVIDER:      'turtles-capi.cattle.io.capiprovider',
};

export const CP_VERSIONS = {
  'kubekey-k3s': ['k3s1', 'k3s2'],
  rke2:          ['rke2r1', 'rke2r2']
};

export const CREDENTIALS_UPDATE_REQUIRED = ['aks'];
export const CREDENTIALS_NOT_REQUIRED = ['docker'];
export interface Worker {
  name: String,
  class: String
}

export interface CAPIClusterTopology {
    version: String,
    class: String,
    workers: {
      machineDeployments: Worker[],
      machinePools: Worker[]
    }
}
export interface CAPIClusterCPEndpoint {
  host: String,
  port: Number
}

export interface CAPIClusterNetwork {
  apiServerPort?: Number,
  pods?: {
    cidrBlocks: String[]
  },
  serviceDomain?: String,
  services?: {
    cidrBlocks: String[]
  },
}

export interface ClusterClass {
  metadata: {
    name: string,
    namespace: string,
    annotations?: {[key: string]: string}
  },
  spec: {
    infrastructure: Object,
    workers: Object,
    controlPlane: Object
  }
}
export const PROVIDER_TYPES = [
  {
    id: 'aws', disabled: false, credentialsRequired: true
  },
  {
    id: 'azure', disabled: false, credentialsRequired: true
  },
  {
    id: 'digitalocean', disabled: false, credentialsRequired: true
  },
  {
    id: 'docker', disabled: false, credentialsRequired: false
  },
  {
    id: 'gcp', disabled: false, credentialsRequired: true
  },
  {
    id: 'vsphere', disabled: false, credentialsRequired: true
  },
  {
    id: 'custom', disabled: false, credentialsRequired: false
  },
];
