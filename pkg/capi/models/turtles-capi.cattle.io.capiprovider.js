import SteveModel from '@shell/plugins/steve/steve-class';

export default class CapiProvider extends SteveModel {
  get canEditYaml() {
    return false;
  }
}
