export const CAPI_PRODUCT_NAME = 'capi-turtles';

export const BLANK_CLUSTER = '_';

export const LABELS = { AUTO_IMPORT: 'cluster-api.cattle.io/rancher-auto-import' };

export const CAPI = {
  CLUSTER_CLASS: 'cluster.x-k8s.io.clusterclass',
  PROVIDER:      'operator.cluster.x-k8s.io.infrastructureprovider',
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
    name: String,
    annotations: Object
  },
  spec: {
    infrastructure: Object,
    workers: Object,
    controlPlane: Object
  }
}

export interface InfrastructureProvider {
  metadata: {
    name: String,
    annotations: Object
  }
}
