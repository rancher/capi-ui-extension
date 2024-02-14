export const CAPI_PRODUCT_NAME = 'capi-turtles';

export const QUERY_PARAMS = { CLASS: 'class' };

export const BLANK_CLUSTER = '_';

export const LABELS = { AUTO_IMPORT: 'cluster-api.cattle.io/rancher-auto-import' };

export const RANCHER_TURTLES_SYSTEM_NAMESPACE = 'capi-system';
export const RANCHER_TURTLES_SYSTEM_NAME = 'capi-env-variables';

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
export interface Provider {
  id: string,
  disabled: boolean,
  needCredentials: boolean,
  requireCredentials: boolean
}

export const PROVIDER_TYPES: Provider[] = [
  {
    id: 'aws', disabled: false, needCredentials: true, requireCredentials: true
  },
  {
    id: 'azure', disabled: false, needCredentials: true, requireCredentials: false
  },
  {
    id: 'digitalocean', disabled: false, needCredentials: true, requireCredentials: false
  },
  {
    id: 'docker', disabled: false, needCredentials: false, requireCredentials: false
  },
  {
    id: 'gcp', disabled: false, needCredentials: true, requireCredentials: false
  },
  {
    id: 'vsphere', disabled: false, needCredentials: true, requireCredentials: false
  },
  {
    id: 'custom', disabled: false, needCredentials: false, requireCredentials: false
  },
];
