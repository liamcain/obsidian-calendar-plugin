import { App, PluginSettingTab, Setting } from "obsidian";

import { DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";

import type CalendarPlugin from "./main";
import {
  appHasDailyNotesPluginLoaded,
  IDailyNoteSettings,
} from "obsidian-daily-notes-interface";

type IWeekStartOption = "sunday" | "monday" | "locale";

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
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

export function syncMomentLocaleWithSettings(settings: ISettings): void {
  const { moment } = window;
  const currentLocale = moment.locale();

  // Save the initial locale weekspec so that we can restore
  // it when toggling between the different options in settings.
  if (!window._bundledLocaleWeekSpec) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window._bundledLocaleWeekSpec = (<any>moment.localeData())._week;
  }

  if (settings.weekStart === "locale") {
    moment.updateLocale(currentLocale, {
      week: window._bundledLocaleWeekSpec,
    });
  } else {
    moment.updateLocale(currentLocale, {
      week: {
        dow: settings.weekStart === "monday" ? 1 : 0,
      },
    });
  }
}

export class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    this.containerEl.createEl("h3", {
      text: "General Settings",
    });
    this.addDotThresholdSetting();
    this.addStartWeekOnMondaySetting();
    this.addConfirmCreateSetting();
    this.addShowWeeklyNoteSetting();

    if (this.plugin.options.showWeeklyNote) {
      this.containerEl.createEl("h3", {
        text: "Weekly Note Settings",
      });
      this.addWeeklyNoteFormatSetting();
      this.addWeeklyNoteTemplateSetting();
      this.addWeeklyNoteFolderSetting();
    }

    if (!appHasDailyNotesPluginLoaded()) {
      this.containerEl.createEl("h3", {
        text: "⚠️ Daily Notes plugin not enabled",
      });
      this.containerEl.createEl("p", {
        text:
          "The calendar is best used in conjunction with the Daily Notes plugin. Enable it in your plugin settings for a more optimal experience.",
      });
    }
  }

  addDotThresholdSetting(): void {
    new Setting(this.containerEl)
      .setName("Words per dot")
      .setDesc("How many words should be represented by a single dot?")
      .addText((textfield) => {
        textfield.setPlaceholder(String(DEFAULT_WORDS_PER_DOT));
        textfield.inputEl.type = "number";
        textfield.setValue(String(this.plugin.options.wordsPerDot));
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            wordsPerDot: Number(value),
          }));
        });
      });
  }

  addStartWeekOnMondaySetting(): void {
    const { moment } = window;

    const [sunday, monday] = moment.weekdays();
    const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;
    const localeWeekStart = moment.weekdays()[localeWeekStartNum];

    new Setting(this.containerEl)
      .setName("Start week on:")
      .setDesc(
        "Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("locale", `Locale default (${localeWeekStart})`);
        dropdown.addOption("sunday", sunday);
        dropdown.addOption("monday", monday);
        dropdown.setValue(this.plugin.options.weekStart);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weekStart: value as IWeekStartOption,
          }));
        });
      });
  }

  addConfirmCreateSetting(): void {
    new Setting(this.containerEl)
      .setName("Confirm before creating new note")
      .setDesc("Show a confirmation modal before creating a new note")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldConfirmBeforeCreate);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            shouldConfirmBeforeCreate: value,
          }));
        });
      });
  }

  addShowWeeklyNoteSetting(): void {
    new Setting(this.containerEl)
      .setName("Show week number")
      .setDesc("Enable this to add a column with the week number")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showWeeklyNote);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            showWeeklyNote: value,
          }));
          this.display(); // show/hide weekly settings
        });
      });
  }

  addWeeklyNoteFormatSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note format")
      .setDesc("For more syntax help, refer to format reference")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteFormat);
        textfield.setPlaceholder(DEFAULT_WEEK_FORMAT);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weeklyNoteFormat: value,
          }));
        });
      });
  }

  addWeeklyNoteTemplateSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note template")
      .setDesc(
        "Choose the file you want to use as the template for your weekly notes"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteTemplate);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weeklyNoteTemplate: value,
          }));
        });
      });
  }

  addWeeklyNoteFolderSetting(): void {
    new Setting(this.containerEl)
      .setName("Weekly note folder")
      .setDesc("New weekly notes will be placed here")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteFolder);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weeklyNoteFolder: value,
          }));
        });
      });
  }
}
