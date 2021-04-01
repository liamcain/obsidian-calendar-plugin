import type { Moment, WeekSpec } from "moment";
import { App, Plugin, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "./constants";
import { settings } from "./ui/stores";
import { CalendarSettingsTab, ISettings } from "./settings";
import CalendarView from "./view";

declare global {
  interface Window {
    app: App;
    moment: () => Moment;
    _bundledLocaleWeekSpec: WeekSpec;
  }
}

// function monkeyPatchConsole(plugin: Plugin) {
//   const logFile = `${plugin.manifest.dir}/logs.txt`;
//   const logs = [];
//   const logMessages = (prefix: string) => (...messages: unknown[]) => {
//     logs.push(`\n[${prefix}]`);
//     for (const message of messages) {
//       logs.push(String(message));
//     }
//     plugin.app.vault.adapter.write(logFile, logs.join(" "));
//   };

//   console.debug = logMessages("debug");
//   console.error = logMessages("error");
//   console.info = logMessages("info");
//   console.log = logMessages("log");
//   console.warn = logMessages("warn");
// }

export default class CalendarPlugin extends Plugin {
  public settings: ISettings;
  private view: CalendarView;

  onunload(): void {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_CALENDAR)
      .forEach((leaf) => leaf.detach());
  }

  async onload(): Promise<void> {
    // monkeyPatchConsole(this);
    this.initLeaf = this.initLeaf.bind(this);
    this.writeSettingsToDisk = this.writeSettingsToDisk.bind(this);
    this.toggleWeekNumbers = this.toggleWeekNumbers.bind(this);

    this.register(
      settings.subscribe((value) => {
        this.settings = value;
        this.saveData(value);
      })
    );

    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf: WorkspaceLeaf) => (this.view = new CalendarView(leaf))
    );

    this.addCommand({
      id: "show-calendar-view",
      name: "Open view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return (
            this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length === 0
          );
        }
        this.initLeaf();
      },
    });

    this.addCommand({
      id: "toggle-week-numbers",
      name: "Toggle week numbers",
      callback: this.toggleWeekNumbers,
    });

    this.addCommand({
      id: "reveal-active-note",
      name: "Reveal active note",
      callback: () => this.view.revealActiveNote(),
    });

    await this.loadSettings();
    this.addSettingTab(new CalendarSettingsTab(this.app, this));

    this.app.workspace.onLayoutReady(this.initLeaf);
  }

  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }

  toggleWeekNumbers(): void {
    settings.update((existingSettings) => ({
      ...existingSettings,
      showWeeklyNote: !existingSettings.showWeeklyNote,
    }));
  }

  async loadSettings(): Promise<void> {
    const savedSettings = await this.loadData();
    settings.update((existingSettings) => ({
      ...existingSettings,
      ...(savedSettings || {}),
    }));

    await this.saveData(this.settings);
  }

  async writeSettingsToDisk(
    settingsUpdater: (settings: ISettings) => Partial<ISettings>
  ): Promise<void> {
    settings.update((old) => ({ ...old, ...settingsUpdater(old) }));
    await this.saveData(this.settings);
  }
}
