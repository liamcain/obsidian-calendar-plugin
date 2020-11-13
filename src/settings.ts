import { App, PluginSettingTab, Setting } from "obsidian";
import { writable } from "svelte/store";

import { DEFAULT_DATE_FORMAT } from "./constants";

import type CalendarPlugin from "./main";

export interface IDailyNoteSettings {
  folder?: string;
  format?: string;
  template?: string;
}

export interface ISettings {
  shouldStartWeekOnMonday: boolean;
  shouldConfirmBeforeCreate: boolean;
}

export function getNoteFolder(settings: ISettings): string {
  const folder = getDailyNoteSettings().folder;
  return folder ? folder.trim() : "";
}

export function getDateFormat(settings: ISettings): string {
  const format = getDailyNoteSettings().format;
  return format || DEFAULT_DATE_FORMAT;
}

export function getDailyNoteTemplatePath(settings: ISettings): string {
  const template = getDailyNoteSettings().template;
  return template ? template.trim() : "";
}

export const SettingsInstance = writable<ISettings>({
  shouldStartWeekOnMonday: false,
  shouldConfirmBeforeCreate: true,
});

/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getDailyNoteSettings(): IDailyNoteSettings {
  try {
    // XXX: Access private API for internal plugins
    const app = (window as any).app;
    return app.internalPlugins.plugins["daily-notes"].instance.options;
  } catch (err) {
    console.info("No custom daily note settings found!", err);
  }
}

function appHasDailyNotesPluginLoaded(app: App) {
  const dailyNotesPlugin = (app as any).internalPlugins.plugins["daily-notes"];
  return dailyNotesPlugin && dailyNotesPlugin.enabled;
}

export class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    this.containerEl.empty();

    this.addStartWeekOnMondaySetting();
    this.addConfirmCreateSetting();

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
}
