import { App, PluginSettingTab, Setting } from "obsidian";
import { writable } from "svelte/store";

import { DEFAULT_WEEK_FORMAT } from "./constants";
import { appHasDailyNotesPluginLoaded, IDailyNoteSettings } from "./dailyNotes";

import type CalendarPlugin from "./main";

export interface ISettings {
  shouldStartWeekOnMonday: boolean;
  shouldConfirmBeforeCreate: boolean;

  // Weekly Note settings
  showWeeklyNote: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;
}

export function getWeeklyNoteSettings(settings: ISettings): IDailyNoteSettings {
  return {
    format: settings.weeklyNoteFormat || DEFAULT_WEEK_FORMAT,
    folder: settings.weeklyNoteFolder ? settings.weeklyNoteFolder.trim() : "",
    template: settings.weeklyNoteTemplate
      ? settings.weeklyNoteTemplate.trim()
      : "",
  };
}

export const SettingsInstance = writable<ISettings>({
  shouldStartWeekOnMonday: false,
  shouldConfirmBeforeCreate: true,
  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",
});

export class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    this.containerEl.empty();

    this.containerEl.createEl("h3", {
      text: "General Settings",
    });
    this.addStartWeekOnMondaySetting();
    this.addConfirmCreateSetting();
    this.addShowWeeklyNoteSetting();

    if (this.plugin.options.showWeeklyNote) {
      this.containerEl.createEl("h3", {
        text: "Weekly Note Settings",
      });
      this.addWeeklyNoteFormatSetting();
      this.addWeeklyNoteFolderSetting();
      this.addWeeklyNoteTemplateSetting();
    }

    if (!appHasDailyNotesPluginLoaded(this.app)) {
      this.containerEl.createEl("h3", {
        text: "⚠️ Daily Notes plugin not enabled",
      });
      this.containerEl.createEl("p", {
        text:
          "The calendar is best used in conjunction with the Daily Notes plugin. Enable it in your plugin settings for a more optimal experience.",
      });
    }
  }

  addStartWeekOnMondaySetting() {
    new Setting(this.containerEl)
      .setName("Start week on Monday")
      .setDesc("Enable this to show Monday as the first day on the calendar")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldStartWeekOnMonday);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(
            (old) => (old.shouldStartWeekOnMonday = value)
          );
        });
      });
  }

  addConfirmCreateSetting() {
    new Setting(this.containerEl)
      .setName("Confirm before creating new note")
      .setDesc("Show a confirmation modal before creating a new note")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldConfirmBeforeCreate);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(
            (old) => (old.shouldConfirmBeforeCreate = value)
          );
        });
      });
  }

  addShowWeeklyNoteSetting() {
    new Setting(this.containerEl)
      .setName("Show week number")
      .setDesc("Enable this to add a column with the week number")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showWeeklyNote);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions((old) => (old.showWeeklyNote = value));
          this.display(); // show/hide weekly settings
        });
      });
  }

  addWeeklyNoteFormatSetting() {
    new Setting(this.containerEl)
      .setName("Weekly note format")
      .setDesc("For more syntax help, refer to format reference")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteFormat);
        textfield.setPlaceholder(DEFAULT_WEEK_FORMAT);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions((old) => (old.weeklyNoteFormat = value));
        });
      });
  }

  addWeeklyNoteTemplateSetting() {
    new Setting(this.containerEl)
      .setName("Weekly note template")
      .setDesc(
        "Choose the file you want to use as the template for your weekly notes"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteTemplate);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions((old) => (old.weeklyNoteTemplate = value));
        });
      });
  }

  addWeeklyNoteFolderSetting() {
    new Setting(this.containerEl)
      .setName("Weekly note folder")
      .setDesc("New weekly notes will be placed here")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteFolder);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions((old) => (old.weeklyNoteFolder = value));
        });
      });
  }
}
