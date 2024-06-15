import * as dailyNotesInterface from "../index";

interface IPerioditySettings extends dailyNotesInterface.IPeriodicNoteSettings {
  enabled: boolean;
}

export function setMonthlyConfig(config: IPerioditySettings): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugin = (<any>window.app).plugins.plugins["periodic-notes"];

  plugin._loaded = true;
  plugin.settings.monthly = {
    ...plugin.settings.monthly,
    ...config,
  };
}

export function setWeeklyConfig(config: IPerioditySettings): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (<any>window.app).plugins.plugins["periodic-notes"]._loaded = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugin = (<any>window.app).plugins.plugins["calendar"];

  plugin._loaded = true;
  plugin.options = {
    weeklyNoteFolder: config.folder,
    weeklyNoteFormat: config.format,
    weeklyNoteTemplate: config.template,
  };
}
export function setPeriodicNotesConfig(
  periodicity: "daily" | "weekly" | "monthly",
  config: IPerioditySettings
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>window.app).plugins.plugins["periodic-notes"];

  periodicNotes._loaded = true;
  periodicNotes.settings[periodicity] = config;
}

export function setDailyConfig(
  config: dailyNotesInterface.IPeriodicNoteSettings
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (<any>window.app).plugins.plugins["periodic-notes"]._loaded = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (<any>window.app).internalPlugins.plugins[
    "daily-notes"
  ].instance.options = config;
}
