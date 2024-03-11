import { importTypes } from '@rancher/auto-import';
import {
  ActionLocation, IPlugin, PanelLocation, TableColumnLocation, TabLocation
} from '@shell/core/types';
import { _CLONE, _CREATE, _EDIT } from '@shell/config/query-params';
import { MANAGEMENT, CAPI as RANCHER_CAPI } from '@shell/config/types';
import { LABELS, CAPI as TURTLES_CAPI } from './types/capi';
import capiRouting from './routes/capi-routing';
import toggleAutoImport from './util/auto-import';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.addProduct(require('./config/capi'));

  // Add Vue Routes
  plugin.addRoutes(capiRouting);

  // add tab to namespace edit
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: ['namespace'],
      cluster:  ['local'],
      mode:     [_CREATE, _CLONE, _EDIT, 'config']
    },
    {
      name:       'capi-auto-import',
      labelKey:   'capi.autoImport.label',
      weight:     -5,
      showHeader: true,
      component:  () => import('./components/AutoImport.vue')
    }
  );

  // add enable auto-import action to namespace table
  plugin.addAction(ActionLocation.TABLE,
    { path: [{ urlPath: '/c/local/explorer/projectsnamespaces', exact: true }, { urlPath: 'cluster.x-k8s.io.cluster', endsWith: true }] },
    {
      labelKey: 'capi.autoImport.enableAction',
      icon:     'icon-plus',
      enabled(target: any) {
        const isProject = target.type === MANAGEMENT.PROJECT;

        return !isProject && target?.metadata?.labels?.[LABELS.AUTO_IMPORT] !== 'true';
      },
      invoke(opts, resources = []) {
        resources.forEach((ns) => {
          toggleAutoImport(ns);
        });
      }
    });

  // add disable auto-import action to namespace table
  plugin.addAction(ActionLocation.TABLE,
    { path: [{ urlPath: '/c/local/explorer/projectsnamespaces', exact: true }, { urlPath: 'cluster.x-k8s.io.cluster', endsWith: true }] },
    {
      labelKey: 'capi.autoImport.disableAction',
      icon:     'icon-minus',
      enabled(target: any) {
        const isProject = target.type === MANAGEMENT.PROJECT;

        return !isProject && target?.metadata?.labels?.[LABELS.AUTO_IMPORT] === 'true';
      },
      invoke(opts, resources = []) {
        resources.forEach((ns) => {
          toggleAutoImport(ns);
        });
      }
    });

  // add column to namespace table
  plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    { path: [{ urlPath: '/c/local/explorer/projectsnamespaces', exact: true }] },
    {
      name:     'capi-auto-import',
      labelKey: 'capi.autoImport.label',
      getValue: (row: any) => {
        return row?.labels?.[LABELS.AUTO_IMPORT] === 'true';
      },
      width:     200,
      align:     'center',
      formatter: 'AutoImportState'
    }
  );

  // add warning to cluster mgmt resource list
  plugin.addPanel(PanelLocation.RESOURCE_LIST,
    { resource: ['provisioning.cattle.io.cluster'] },
    { component: () => import('./components/ClusterListBanner.vue') }
  );

  plugin.addPanel(PanelLocation.RESOURCE_LIST,
    {
      resource: [RANCHER_CAPI.CAPI_CLUSTER,
        TURTLES_CAPI.CLUSTER_CLASS,
        TURTLES_CAPI.PROVIDER,
        RANCHER_CAPI.MACHINE,
        RANCHER_CAPI.MACHINE_SET,
        RANCHER_CAPI.MACHINE_DEPLOYMENT]
    },
    { component: () => import('./components/ExperimentalBanner.vue') }
  );

  plugin.addPanel(PanelLocation.DETAIL_TOP,
    {
      resource: [RANCHER_CAPI.CAPI_CLUSTER,
        TURTLES_CAPI.CLUSTER_CLASS,
        TURTLES_CAPI.PROVIDER,
        RANCHER_CAPI.MACHINE,
        RANCHER_CAPI.MACHINE_SET,
        RANCHER_CAPI.MACHINE_DEPLOYMENT]
    },
    { component: () => import('./components/ExperimentalBanner.vue') }
  );

  plugin.addPanel(PanelLocation.DETAILS_MASTHEAD,
    {
      resource: [RANCHER_CAPI.CAPI_CLUSTER,
        TURTLES_CAPI.CLUSTER_CLASS,
        TURTLES_CAPI.PROVIDER,
        RANCHER_CAPI.MACHINE,
        RANCHER_CAPI.MACHINE_SET,
        RANCHER_CAPI.MACHINE_DEPLOYMENT]
    },
    { component: () => import('./components/ExperimentalBanner.vue') }
  );
}
