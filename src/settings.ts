import { App, PluginSettingTab, Setting } from "obsidian";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";
import type { ILocaleOverride, IWeekStartOption } from "obsidian-calendar-ui";

import { DEFAULT_WEEK_FORMAT, DEFAULT_WORDS_PER_DOT } from "src/constants";
import { t } from "./i18n";

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

  // Monthly Note settings
  showMonthlyNote: boolean;
  monthlyNoteFormat: string;
  monthlyDotColor: string;

  // Canvas Schedule settings
  showCanvasSchedules: boolean;
  canvasSchedulesFolder: string;
  canvasSchedulesDotColor: string;

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
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  showMonthlyNote: false,
  monthlyNoteFormat: "",
  monthlyDotColor: "#9b59b6",

  showCanvasSchedules: false,
  canvasSchedulesFolder: "",
  canvasSchedulesDotColor: "#3498db",

  localeOverride: "system-default",
});

export function appHasPeriodicNotesPluginLoaded(): boolean {
  const periodicNotes = (window.app as { plugins: { getPlugin: (id: string) => { settings?: { weekly?: { enabled?: boolean } } } | null } }).plugins.getPlugin("periodic-notes");
  return periodicNotes?.settings?.weekly?.enabled ?? false;
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
          text: t('settings.banner.dailyNotesDisabled'),
        });
        banner.createEl("p", {
          cls: "setting-item-description",
          text: t('settings.banner.dailyNotesDisabled.desc'),
        });
      });
    }

    this.containerEl.createEl("h3", {
      text: t('settings.general'),
    });
    this.addDotThresholdSetting();
    this.addWeekStartSetting();
    this.addConfirmCreateSetting();
    this.addShowWeeklyNoteSetting();
    this.addShowMonthlyNoteSetting();

    if (this.plugin.options.showMonthlyNote) {
      this.addMonthlyDotColorSetting();
    }

    this.addShowCanvasSchedulesSetting();

    if (this.plugin.options.showCanvasSchedules) {
      this.addCanvasSchedulesFolderSetting();
      this.addCanvasSchedulesDotColorSetting();
    }

    if (
      this.plugin.options.showWeeklyNote &&
      !appHasPeriodicNotesPluginLoaded()
    ) {
      this.containerEl.createEl("h3", {
        text: t('settings.weekly'),
      });
      this.containerEl.createEl("p", {
        cls: "setting-item-description",
        text: t('settings.weekly.moving'),
      });
      this.addWeeklyNoteFormatSetting();
      this.addWeeklyNoteTemplateSetting();
      this.addWeeklyNoteFolderSetting();
    }

    this.containerEl.createEl("h3", {
      text: t('settings.advanced'),
    });
    this.addLocaleOverrideSetting();
  }

  addDotThresholdSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.wordsPerDot'))
      .setDesc(t('settings.wordsPerDot.desc'))
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
      .setName(t('settings.weekStart'))
      .setDesc(t('settings.weekStart.desc'))
      .addDropdown((dropdown) => {
        dropdown.addOption("locale", t('settings.weekStart.localeDefault', { day: localeWeekStart }));
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
      .setName(t('settings.confirmCreate'))
      .setDesc(t('settings.confirmCreate.desc'))
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
      .setName(t('settings.showWeekNumber'))
      .setDesc(t('settings.showWeekNumber.desc'))
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
      .setName(t('settings.weekly.format'))
      .setDesc(t('settings.weekly.format.desc'))
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
      .setName(t('settings.weekly.template'))
      .setDesc(t('settings.weekly.template.desc'))
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.weeklyNoteTemplate);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ weeklyNoteTemplate: value }));
        });
      });
  }

  addWeeklyNoteFolderSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.weekly.folder'))
      .setDesc(t('settings.weekly.folder.desc'))
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
      .setName(t('settings.locale'))
      .setDesc(t('settings.locale.desc'))
      .addDropdown((dropdown) => {
        dropdown.addOption("system-default", t('settings.locale.systemDefault', { locale: sysLocale }));
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

  addShowMonthlyNoteSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.monthly.show'))
      .setDesc(t('settings.monthly.show.desc'))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showMonthlyNote);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ showMonthlyNote: value }));
          this.display(); // show/hide monthly settings
        });
      });
  }

  addMonthlyDotColorSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.monthly.dotColor'))
      .setDesc(t('settings.monthly.dotColor.desc'))
      .addText((textfield) => {
        textfield.setPlaceholder("#9b59b6");
        textfield.setValue(this.plugin.options.monthlyDotColor);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ monthlyDotColor: value || "#9b59b6" }));
        });
      });
  }

  addShowCanvasSchedulesSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.canvasSchedules.show'))
      .setDesc(t('settings.canvasSchedules.show.desc'))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showCanvasSchedules);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ showCanvasSchedules: value }));
          this.display(); // show/hide canvas schedule settings
        });
      });
  }

  addCanvasSchedulesFolderSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.canvasSchedules.folder'))
      .setDesc(t('settings.canvasSchedules.folder.desc'))
      .addText((textfield) => {
        textfield.setValue(this.plugin.options.canvasSchedulesFolder);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ canvasSchedulesFolder: value }));
        });
      });
  }

  addCanvasSchedulesDotColorSetting(): void {
    new Setting(this.containerEl)
      .setName(t('settings.canvasSchedules.dotColor'))
      .setDesc(t('settings.canvasSchedules.dotColor.desc'))
      .addText((textfield) => {
        textfield.setPlaceholder("#3498db");
        textfield.setValue(this.plugin.options.canvasSchedulesDotColor);
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            canvasSchedulesDotColor: value || "#3498db",
          }));
        });
      });
  }
}
