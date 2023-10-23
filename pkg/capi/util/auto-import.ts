import { LABELS } from '../types/capi';

export default function(resource: any) {
  if (resource?.metadata?.labels?.[LABELS.AUTO_IMPORT] === 'true') {
    delete resource.metadata.labels[LABELS.AUTO_IMPORT];
  } else {
    resource.metadata.labels[LABELS.AUTO_IMPORT] = 'true';
  }
  try {
    resource.save();
  } catch (err) {
    const title = resource.t('resource.errors.update', { name: resource.name });

    resource.$dispatch('growl/error', {
      title, message: err, timeout: 5000
    }, { root: true });
  }
}
