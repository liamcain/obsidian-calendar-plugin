import { Plugin, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "./constants";
import { CalendarSettingsTab, SettingsInstance, ISettings } from "./settings";
import CalendarView from "./view";

export default class CalendarPlugin extends Plugin {
  public options: ISettings;
  private view: CalendarView;
  private settingsUnsubscribe: () => void;

  onunload() {
    this.settingsUnsubscribe();
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_CALENDAR)
      .forEach((leaf) => leaf.detach());
  }

  async onload() {
    this.settingsUnsubscribe = SettingsInstance.subscribe((value) => {
      this.options = value;
    });

    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf: WorkspaceLeaf) =>
        (this.view = new CalendarView(leaf, this.options))
    );

    this.registerEvent(
      this.app.vault.on("delete", () => {
        if (this.view) {
          this.view.redraw();
        }
      })
    );

    this.addCommand({
      id: "show-calendar-view",
      name: "Open view",
      callback: this.initLeaf.bind(this),
    });

    this.addCommand({
      id: "reload-calendar-view",
      name: "Reload daily note settings",
      callback: () => this.view.redraw(),
    });

    await this.loadOptions();

    this.addSettingTab(new CalendarSettingsTab(this.app, this));

    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.registerEvent(
        this.app.workspace.on("layout-ready", this.initLeaf.bind(this))
      );
    }
  }

  initLeaf() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }

  async loadOptions(): Promise<void> {
    const options = await this.loadData();
    SettingsInstance.update((old) => {
      return {
        ...old,
        ...(options || {}),
      };
    });

    await this.saveData(this.options);
  }

  async writeOptions(changeOpts: (settings: ISettings) => void): Promise<void> {
    SettingsInstance.update((old) => {
      changeOpts(old);
      return old;
    });
    await this.saveData(this.options);
  }
}
