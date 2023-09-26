import { importTypes } from '@rancher/auto-import';
import {
  ActionLocation, IPlugin, PanelLocation, TableColumnLocation, TabLocation
} from '@shell/core/types';
import { _CLONE, _CREATE, _EDIT } from '@shell/config/query-params';
import { LABELS } from './types/capi';
import capiRouting from './routes/capi-routing';

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

  // add enable action to namespace table
  plugin.addAction(ActionLocation.TABLE,
    { path: [{ urlPath: '/c/local/explorer/projectsnamespaces', exact: true }] },
    {
      labelKey: 'capi.autoImport.enableAction',
      icon:     'icon-plus',
      enabled(ns: any) {
        return ns.metadata.labels[LABELS.AUTO_IMPORT] !== 'true';
      },
      invoke(opts, resources = []) {
        resources.forEach((ns) => {
          ns.metadata.labels[LABELS.AUTO_IMPORT] = 'true';
          try {
            ns.save();
          } catch (err) {
            const title = ns.t('resource.errors.update', { name: ns.name });

            ns.$dispatch('growl/error', {
              title, message: err, timeout: 5000
            }, { root: true });
          }
        });
      }
    });

  // add disable action to namespace table
  plugin.addAction(ActionLocation.TABLE,
    { path: [{ urlPath: '/c/local/explorer/projectsnamespaces', exact: true }] },
    {
      labelKey: 'capi.autoImport.disableAction',
      icon:     'icon-minus',
      enabled(ns: any) {
        return ns.metadata.labels[LABELS.AUTO_IMPORT] === 'true';
      },
      invoke(opts, resources = []) {
        resources.forEach((ns) => {
          delete ns.metadata.labels[LABELS.AUTO_IMPORT];
          try {
            ns.save();
          } catch (err) {
            const title = ns.t('resource.errors.update', { name: ns.name });

            ns.$dispatch('growl/error', {
              title, message: err, timeout: 5000
            }, { root: true });
          }
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
        return row.labels[LABELS.AUTO_IMPORT] === 'true';
      },
      width:     100,
      formatter: 'AutoImportState'
    }
  );

  // add warning to cluster mgmt resource list
  plugin.addPanel(PanelLocation.RESOURCE_LIST,
    { resource: ['provisioning.cattle.io.cluster'] },
    { component: () => import('./components/ClusterListBanner.vue') }
  );
}
