import { App, PluginSettingTab, Setting } from "obsidian";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";
import type { ILocaleOverride, IWeekStartOption } from "obsidian-calendar-ui";

import { DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";

import type CalendarPlugin from "./main";

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;
  shouldIndexDailyNotesInAllFolders: boolean;
  dailyNoteFilenameDateFormat: string;
  shouldIndexDailyNotesFromFrontmatter: boolean;
  dailyNoteFrontmatterDateFields: string;
  dailyNoteIncludedFolders: string;

  // Weekly Note settings
  showWeeklyNote: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;

  localeOverride: ILocaleOverride;
}

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const defaultSettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  shouldIndexDailyNotesInAllFolders: false,
  dailyNoteFilenameDateFormat: "",
  shouldIndexDailyNotesFromFrontmatter: false,
  dailyNoteFrontmatterDateFields: "date, daily_date, calendar_date",
  dailyNoteIncludedFolders: "",
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default",
});

export function appHasPeriodicNotesPluginLoaded(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>window.app).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.weekly?.enabled;
}

export class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    if (!appHasDailyNotesPluginLoaded()) {
      this.containerEl.createDiv("settings-banner", (banner) => {
        banner.createEl("h3", {
          text: "⚠️ Daily Notes plugin not enabled",
        });
        banner.createEl("p", {
          cls: "setting-item-description",
          text:
            "The calendar is best used in conjunction with either the Daily Notes plugin or the Periodic Notes plugin (available in the Community Plugins catalog).",
        });
      });
    }

    this.containerEl.createEl("h3", {
      text: "General Settings",
    });
    this.addWeekStartSetting();
    this.addConfirmCreateSetting();
    this.addIndexDailyNotesInAllFoldersSetting();
    this.addDailyNoteIncludedFoldersSetting();
    this.addDailyNoteFilenameDateFormatSetting();
    this.addIndexDailyNotesFromFrontmatterSetting();
    this.addDailyNoteFrontmatterDateFieldsSetting();
    this.addShowWeeklyNoteSetting();

    if (
      this.plugin.options.showWeeklyNote &&
      !appHasPeriodicNotesPluginLoaded()
    ) {
      this.containerEl.createEl("h3", {
        text: "Weekly Note Settings",
      });
      this.containerEl.createEl("p", {
        cls: "setting-item-description",
        text:
          "Note: Weekly Note settings are moving. You are encouraged to install the 'Periodic Notes' plugin to keep the functionality in the future.",
      });
      this.addWeeklyNoteFormatSetting();
      this.addWeeklyNoteTemplateSetting();
      this.addWeeklyNoteFolderSetting();
    }

    this.containerEl.createEl("h3", {
      text: "Advanced Settings",
    });
    this.addLocaleOverrideSetting();
  }

  addWeekStartSetting(): void {
    const { moment } = window;

    const localizedWeekdays = moment.weekdays();
    const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;
    const localeWeekStart = moment.weekdays()[localeWeekStartNum];

    new Setting(this.containerEl)
      .setName("Start week on:")
      .setDesc(
        "Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("locale", `Locale default (${localeWeekStart})`);
        localizedWeekdays.forEach((day, i) => {
          dropdown.addOption(weekdays[i], day);
        });
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

  addIndexDailyNotesInAllFoldersSetting(): void {
    new Setting(this.containerEl)
      .setName("Detect daily notes in all folders")
      .setDesc(
        "Find every Markdown file whose file name matches the daily note format, even outside the configured daily notes folder. Matching notes for the selected date appear below the calendar."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldIndexDailyNotesInAllFolders);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            shouldIndexDailyNotesInAllFolders: value,
          }));
        });
      });
  }

  addDailyNoteFilenameDateFormatSetting(): void {
    new Setting(this.containerEl)
      .setName("Date format inside daily note filenames")
      .setDesc(
        "Optional. Calendar already looks for the Daily Notes date format anywhere in the file name. Add extra comma-separated formats here, such as YYYYMMDD for files like 'meeting 20260529.md'."
      )
      .addText((textfield) => {
        textfield.setPlaceholder("YYYYMMDD");
        textfield.setValue(this.plugin.options.dailyNoteFilenameDateFormat);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            dailyNoteFilenameDateFormat: value,
          }));
        });
      });
  }

  addIndexDailyNotesFromFrontmatterSetting(): void {
    new Setting(this.containerEl)
      .setName("Use frontmatter date fallback")
      .setDesc(
        "When a file name does not contain a matching date, read the configured frontmatter fields and map the note to that date."
      )
      .addToggle((toggle) => {
        toggle.setValue(
          this.plugin.options.shouldIndexDailyNotesFromFrontmatter
        );
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            shouldIndexDailyNotesFromFrontmatter: value,
          }));
        });
      });
  }

  addDailyNoteFrontmatterDateFieldsSetting(): void {
    new Setting(this.containerEl)
      .setName("Frontmatter date fields")
      .setDesc(
        "Comma-separated field names to read when frontmatter fallback is enabled. Nested fields can use dot notation, such as calendar.date."
      )
      .addText((textfield) => {
        textfield.setPlaceholder("date, daily_date, calendar_date");
        textfield.setValue(this.plugin.options.dailyNoteFrontmatterDateFields);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            dailyNoteFrontmatterDateFields: value,
          }));
        });
      });
  }

  addDailyNoteIncludedFoldersSetting(): void {
    new Setting(this.containerEl)
      .setName("Folders to scan for daily notes")
      .setDesc(
        "Optional. Leave blank to scan the whole vault. Add comma-separated folder paths to limit filename and frontmatter matching."
      )
      .addTextArea((textarea) => {
        textarea.setPlaceholder(
          "Journal, Work/Daily, Projects/Research"
        );
        textarea.setValue(this.plugin.options.dailyNoteIncludedFolders);
        textarea.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            dailyNoteIncludedFolders: value,
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
          this.plugin.writeOptions(() => ({ showWeeklyNote: value }));
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
          this.plugin.writeOptions(() => ({ weeklyNoteFormat: value }));
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
          this.plugin.writeOptions(() => ({ weeklyNoteTemplate: value }));
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
          this.plugin.writeOptions(() => ({ weeklyNoteFolder: value }));
        });
      });
  }

  addLocaleOverrideSetting(): void {
    const { moment } = window;

    const sysLocale = navigator.language?.toLowerCase();

    new Setting(this.containerEl)
      .setName("Override locale:")
      .setDesc(
        "Set this if you want to use a locale different from the default"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("system-default", `Same as system (${sysLocale})`);
        moment.locales().forEach((locale) => {
          dropdown.addOption(locale, locale);
        });
        dropdown.setValue(this.plugin.options.localeOverride);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            localeOverride: value as ILocaleOverride,
          }));
        });
      });
  }
}
