import { Plugin, TFile, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "./constants";
import { createActiveFileStore, createSettingsStore } from "./ui/stores";
import { DEFAULT_SETTINGS, type ISettings } from "./settings";
import CalendarView from "./view";
import CalendarSettingsTab from "./ui/settings-tab";
import { type Writable } from "svelte/store";
import { initializeLocaleConfigOnce } from "src/localization";

export default class CalendarPlugin extends Plugin {
  public settings: Writable<ISettings>;
  public activeFile: Writable<TFile | undefined>;

  onunload(): void {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_CALENDAR)
      .forEach((leaf) => leaf.detach());
  }

  async onload(): Promise<void> {
    this.activeFile = createActiveFileStore();
    this.settings = createSettingsStore();
    await this.loadSettings();

    this.register(this.settings.subscribe(this.onUpdateSettings.bind(this)));

    initializeLocaleConfigOnce(this.app);

    this.initLeaf = this.initLeaf.bind(this);
    this.toggleWeekNumbers = this.toggleWeekNumbers.bind(this);

    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf: WorkspaceLeaf) => new CalendarView(leaf, this.app, this)
    );

    this.addCommand({
      id: "show-calendar-view",
      name: "Open view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length === 0;
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
      callback: this.revealActiveNote.bind(this),
    });

    this.addSettingTab(new CalendarSettingsTab(this.app, this));

    this.app.workspace.onLayoutReady(this.initLeaf);
  }

  revealActiveNote() {
    const calendarViews = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
    if (calendarViews.length > 0) {
      (calendarViews[0].view as CalendarView).revealActiveNote();
    }
  }

  initLeaf(): void {
    // TODO, only initialize leaf on fresh install
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }

  public toggleWeekNumbers(): void {
    this.settings.update((existingSettings) => ({
      ...existingSettings,
      showWeeklyNote: !existingSettings.showWeeklyNote,
    }));
  }

  public shouldUseISOWeekNumbers(): boolean {
    return this.app.plugins.getPlugin("periodic-notes")?.isWeeklyFormatISO8601() ?? false;
  }

  private async onUpdateSettings(newSettings: ISettings): Promise<void> {
    await this.saveData(newSettings);
    this.app.workspace.trigger("calendar:metadata-updated");
  }

  async loadSettings(): Promise<void> {
    const savedSettings = await this.loadData();
    const settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings || {});
    this.settings.set(settings);
  }
}
