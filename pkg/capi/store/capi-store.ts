import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';
import { SteveFactory, steveStoreInit } from '@shell/plugins/steve/index';
import getters from './getters'; // this would be your getters file on your extension /store folder
import mutations from './mutations'; // this would be your mutations file on your extension /store folder
import actions from './actions'; // this would be your actions file on your extension /store folder

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const CAPI_PRODUCT_NAME = 'CAPI';

const CapiFactory = (): CoreStoreSpecifics => {
  const steveFactory = SteveFactory();

  steveFactory.getters = {
    ...steveFactory.getters,
    ...getters,
  };

  steveFactory.mutations = {
    ...steveFactory.mutations,
    ...mutations,
  };

  steveFactory.actions = {
    ...steveFactory.actions,
    ...actions,
  };

  return steveFactory;
};

const config: CoreStoreConfig = { namespace: CAPI_PRODUCT_NAME };

export default {
  specifics: CapiFactory(),
  config
};
