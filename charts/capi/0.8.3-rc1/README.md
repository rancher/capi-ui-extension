# CAPI Provisioning


### **The CAPI UI extension is in tech preview.**

Create clusters using the Cluster API and automatically import them into Rancher. The Turtles chart must be installed in the local Rancher cluster for the CAPI UI extension to work. Read more about the Rancher Turtles project [here](https://turtles.docs.rancher.com/turtles/next/en/index.html).



#### Clusterclass Annotations
The capi UI supports a small collection of annotations that may be applied to clusterclass variables to enhance the cluster creation UI.


|  Name | Description|
| --- | --- |
| `turtles-capi.cattle.io/section` | Add variables to an expandable section. You can add variables to existing sections in the cluster form using one of the following values: `general`, `controlplane`, `networking`, or `workers`|
| `turtles-capi.cattle.io/group` | Group variables within a section. Groups within groups are not supported.|
| `turtles-capi.cattle.io/highlight` | Call extra attention to a variable, giving it a larger label and expanded description. Optionally, use a value of `warning` or `error` to add an icon and coloration (yellow for warning, red for error)|
| `turtles-capi.cattle.io/label` | Add a label to your variable. Alternatively, name your variable one of the keys listed under `capi.variables` in ./pkg/capi/en-us.yaml|
| `turtles-capi.cattle.io/toggled-by` | Tell the UI that this variable should only be shown when other variables are truthy. This is a comma-separated list of variable names. Boolean type variables that appear in another variable's toggled-by annotation will be rendered as toggle switches instead of checkboxes. It is the responsibility of the clusterclass author to group toggled variables near their toggle.|
| `turtles-capi.cattle.io/type` | The value of this annotation should be a kubernetes resource type eg `infrastructure.cluster.x-k8s.io.azureclusteridentity` Tell the UI that this variable should be a reference to some kubernetes resource in the local cluster. The UI will automatically search for all instances of this resource type and provide the user a dropdown to select one, or manually enter a name if they do not have permission to view the resource but know its there. This annotation may only be used with object type variables that specify a name key and, if the resource is namespaced, a namespace key.|