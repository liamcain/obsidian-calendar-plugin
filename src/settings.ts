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
  useDailyNoteSettings: boolean;
  shouldStartWeekOnMonday: boolean;

  folder?: string;
  format?: string;
  template?: string;
}

export const SettingsInstance = writable<ISettings>({
  useDailyNoteSettings: true,
  shouldStartWeekOnMonday: false,

  folder: null,
  format: null,
  template: null,
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
    const { app, containerEl, plugin } = this;

    containerEl.empty();

    this.startWeekOnMonday();

    if (!appHasDailyNotesPluginLoaded(app)) {
      containerEl.createEl("h2", {
        text: "⚠️ Daily Notes plugin not enabled",
      });
      containerEl.createEl("p", {
        text:
          "The calendar is best used in conjunction with the Daily Notes plugin. Enable it in your plugin settings for a more optimal experience.",
      });
    } else {
      this.useDailyNoteSettings();
    }

    if (
      !appHasDailyNotesPluginLoaded(app) ||
      !plugin.options.useDailyNoteSettings
    ) {
      this.customNoteSettings();
    }
  }

  startWeekOnMonday() {
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

  useDailyNoteSettings() {
    new Setting(this.containerEl)
      .setName("Use Daily Note settings")
      .setDesc(
        "Disable if you want to use custom settings that vary from your Daily Note configuration."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.useDailyNoteSettings);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions((old) => (old.useDailyNoteSettings = value));
          this.display();
        });
      });
  }

  customNoteSettings() {
    new Setting(this.containerEl)
      .setName("Template path")
      .setDesc("Choose the file to use as a template.")
      .addText((toggle) => {
        toggle.setValue(this.plugin.options.template);
        toggle.setPlaceholder("Example: folder/note");
        toggle.onChange((value) => {
          this.plugin.writeOptions((old) => (old.template = value));
        });
      });

    new Setting(this.containerEl)
      .setName("Folder")
      .setDesc("New daily notes will be placed here.")
      .addText((toggle) => {
        toggle.setValue(this.plugin.options.folder);
        toggle.setPlaceholder("Example: folder 1/folder");
        toggle.onChange((value) => {
          this.plugin.writeOptions((old) => (old.folder = value));
        });
      });

    new Setting(this.containerEl).setName("Date Format").addText((toggle) => {
      toggle.setValue(this.plugin.options.format);
      toggle.setPlaceholder("YYYY-MM-DD");
      toggle.onChange((value) => {
        this.plugin.writeOptions((old) => (old.format = value));
      });
    });
  }
}

export function getNoteFolder(settings: ISettings): string {
  const folder = settings.useDailyNoteSettings
    ? getDailyNoteSettings().folder
    : settings.folder;
  return folder || "";
}

export function getDateFormat(settings: ISettings): string {
  const format = settings.useDailyNoteSettings
    ? getDailyNoteSettings().format
    : settings.format;
  return format || DEFAULT_DATE_FORMAT;
}

export function getDailyNoteTemplatePath(settings: ISettings): string {
  const template = settings.useDailyNoteSettings
    ? getDailyNoteSettings().template
    : settings.template;
  return template || "";
}
