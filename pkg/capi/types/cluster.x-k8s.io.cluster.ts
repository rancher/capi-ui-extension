
export interface CapiClusterVariable {
  name: string,
  value?: any
}

export interface CapiCluster {
  spec?: {
    topology?: {
      variables?: Array<CapiClusterVariable>
    }
  }
}
