import SteveModel from '@shell/plugins/steve/steve-class';
import {
  _YAML,
  AS,
} from '@shell/config/query-params';

export default class CapiCluster extends SteveModel {
  get canEditYaml() {
    return false;
  }

  get canUpdate() {
    return false;
  }

  get detailLocation() {
    const location = super._detailLocation;

    return { ...location, query: { [AS]: _YAML } };
  }

  get _availableActions() {
    const out = super._availableActions;

    return out.filter(action => action.action !== 'goToEdit' && action.action !== 'goToViewConfig');
  }
}