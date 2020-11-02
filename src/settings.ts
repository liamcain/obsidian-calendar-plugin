import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { writable } from "svelte/store";

import type CalendarPlugin from "./main";

export interface IDailyNoteSettings {
  folder?: string;
  format?: string;
  template?: string;
}

export interface ISettings {
  useDailyNoteSettings: boolean;

  folder?: string;
  format?: string;
  template?: string;
}

export const SettingsInstance = writable<ISettings>({
  useDailyNoteSettings: true,

  folder: null,
  format: null,
  template: null,
});

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

    if (!plugin.options.useDailyNoteSettings) {
      this.customNoteSettings();
    }
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
