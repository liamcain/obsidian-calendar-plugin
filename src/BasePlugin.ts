export default class BasePlugin {
  id: string;
  name: string;
  description?: string;
  defaultOn: boolean;
  defaultViewTypes: Array<string> = [];
  options: object;

  app: any;
  instance: any;

  init(app: any, instance: any) {
    this.app = app;
    this.instance = instance;
    this.options = {};

    this.initLeaf = this.initLeaf.bind(this);

    this.instance.registerEvent(
      this.app.workspace.on("layout-ready", this.initLeaf)
    );
  }

  initLeaf() {
    this.defaultViewTypes.forEach((viewType) => {
      if (this.app.workspace.getLeavesOfType(viewType).length) {
        return;
      }
      this.app.workspace.getRightLeaf(false).setViewState({
        type: viewType,
      });
    });
  }

  onEnable() {
    this.initLeaf();
  }

  onLoad() {}
}
