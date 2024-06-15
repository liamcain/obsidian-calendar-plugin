import type moment from "moment";
import { App } from "obsidian";

declare global {
  interface Window {
    app: App;
    moment: typeof moment;
  }
}

export function appHasDailyNotesPluginLoaded(): boolean {
  const { app } = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyNotesPlugin = (<any>app).internalPlugins.plugins["daily-notes"];
  if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>app).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.daily?.enabled;
}

/**
 * XXX: "Weekly Notes" live in either the Calendar plugin or the periodic-notes plugin.
 * Check both until the weekly notes feature is removed from the Calendar plugin.
 */
export function appHasWeeklyNotesPluginLoaded(): boolean {
  const { app } = window;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((<any>app).plugins.getPlugin("calendar")) {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>app).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.weekly?.enabled;
}

export function appHasMonthlyNotesPluginLoaded(): boolean {
  const { app } = window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>app).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.monthly?.enabled;
}

export {
  DEFAULT_DAILY_NOTE_FORMAT,
  DEFAULT_WEEKLY_NOTE_FORMAT,
  DEFAULT_MONTHLY_NOTE_FORMAT,
} from "./constants";

export type { IGranularity, IPeriodicNoteSettings } from "./types";
export {
  getDailyNoteSettings,
  getWeeklyNoteSettings,
  getMonthlyNoteSettings,
} from "./settings";
export { createDailyNote, getDailyNote, getAllDailyNotes } from "./daily";
export { createWeeklyNote, getAllWeeklyNotes, getWeeklyNote } from "./weekly";
export {
  createMonthlyNote,
  getAllMonthlyNotes,
  getMonthlyNote,
} from "./monthly";

export { getDateUID, getDateFromFile } from "./parse";
export { getTemplateInfo } from "./vault";
