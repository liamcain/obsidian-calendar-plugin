import { App, PluginSettingTab, Setting } from "obsidian";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";
import type { ILocaleOverride, IWeekStartOption } from "obsidian-calendar-ui";

import { DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";

import type CalendarPlugin from "./main";

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;

  // Weekly Note settings
  showWeeklyNote: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;

  localeOverride: ILocaleOverride;

  // Day Markers
  showDayMarkers: boolean;
  holidayApiUrl: string;
  leaveDayTag: string;

  // Status Tags (Phase 1)
  enableStatusTags: boolean;

  // Mood Tracking (Phase 2)
  enableMoodTracking: boolean;
  moodFieldName: string;

  // Weather (Phase 2)
  enableWeather: boolean;
  weatherCity: string;     // user-specified city name (empty = use IP geolocation)
  weatherLatitude: number;
  weatherLongitude: number;
  autoWriteWeather: boolean;  // auto-write weather to daily note frontmatter
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
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default",

  showDayMarkers: true,
  holidayApiUrl: "https://timor.tech/api/holiday/year/",
  leaveDayTag: "请假",

  enableStatusTags: true,

  enableMoodTracking: false,
  moodFieldName: "mood",

  enableWeather: false,
  weatherCity: "",
  weatherLatitude: 0,
  weatherLongitude: 0,
  autoWriteWeather: true,
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
    this.addDotThresholdSetting();
    this.addWeekStartSetting();
    this.addConfirmCreateSetting();
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
      text: "Day Markers",
    });
    this.addShowDayMarkersSetting();
    this.addHolidayApiUrlSetting();
    this.addLeaveDayTagSetting();

    this.containerEl.createEl("h3", {
      text: "Status Tags",
    });
    this.addStatusTagsToggleSetting();

    this.containerEl.createEl("h3", {
      text: "Mood Tracking",
    });
    this.addMoodTrackingSetting();

    this.containerEl.createEl("h3", {
      text: "Weather (Auto-Fetch)",
    });
    this.addWeatherSettings();

    this.containerEl.createEl("h3", {
      text: "Advanced Settings",
    });
    this.addLocaleOverrideSetting();
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
            wordsPerDot: value !== "" ? Number(value) : undefined,
          }));
        });
      });
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

  addShowDayMarkersSetting(): void {
    new Setting(this.containerEl)
      .setName("Show day markers")
      .setDesc(
        "Highlight holidays, leave days, and makeup workdays on the calendar"
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showDayMarkers);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ showDayMarkers: value }));
        });
      });
  }

  addHolidayApiUrlSetting(): void {
    new Setting(this.containerEl)
      .setName("Holiday API URL")
      .setDesc(
        "API endpoint for fetching public holidays. Year will be appended automatically. Default: https://timor.tech/api/holiday/year/"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.holidayApiUrl);
        textfield.setPlaceholder("https://timor.tech/api/holiday/year/");
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ holidayApiUrl: value }));
        });
      });
  }

  addLeaveDayTagSetting(): void {
    new Setting(this.containerEl)
      .setName("Leave day tag")
      .setDesc(
        "Tag in daily note frontmatter that marks a leave day (e.g. 请假)"
      )
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.leaveDayTag);
        textfield.setPlaceholder("请假");
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ leaveDayTag: value }));
        });
      });
  }

  addStatusTagsToggleSetting(): void {
    new Setting(this.containerEl)
      .setName("Enable status tags")
      .setDesc(
        "Parse frontmatter status/tags to display status emojis and colors on the calendar"
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.enableStatusTags);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ enableStatusTags: value }));
        });
      });
  }

  addMoodTrackingSetting(): void {
    new Setting(this.containerEl)
      .setName("Enable mood tracking")
      .setDesc(
        "Read mood from daily note frontmatter and display mood emoji on the calendar"
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.enableMoodTracking);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ enableMoodTracking: value }));
        });
      });

    new Setting(this.containerEl)
      .setName("Mood field name")
      .setDesc("Frontmatter field name for mood (default: mood)")
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.moodFieldName);
        textfield.setPlaceholder("mood");
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ moodFieldName: value }));
        });
      });
  }

  addWeatherSettings(): void {
    new Setting(this.containerEl)
      .setName("Enable weather auto-fetch")
      .setDesc(
        "Automatically fetch weather data from Open-Meteo and display on the calendar. City is auto-detected via IP, or you can specify manually."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.enableWeather);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ enableWeather: value }));
        });
      });

    new Setting(this.containerEl)
      .setName("City")
      .setDesc(
        "Enter your city name for weather lookups. Leave empty to use IP-based auto-detection."
      )
      .addText((textfield) => {
        const city = this.plugin.options.weatherCity;
        const lat = this.plugin.options.weatherLatitude;
        const lon = this.plugin.options.weatherLongitude;
        if (city) {
          textfield.setValue(city);
        } else if (lat !== 0 && lon !== 0) {
          textfield.setPlaceholder(`Auto-detected: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        } else {
          textfield.setPlaceholder("Auto-detect via IP");
        }
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weatherCity: value,
          }));
        });
      });

    new Setting(this.containerEl)
      .setName("Auto-write to daily note")
      .setDesc(
        "Automatically write weather data to daily note frontmatter when creating or opening a note"
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.autoWriteWeather);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ autoWriteWeather: value }));
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
