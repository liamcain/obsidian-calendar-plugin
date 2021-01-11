import type { TFile } from "obsidian";
import { get, writable } from "svelte/store";
import {
  getAllDailyNotes,
  getDateFromFile,
  getDateUID,
} from "obsidian-daily-notes-interface";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

function createDailyNotesStore() {
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => store.set(getAllDailyNotes()),
    ...store,
  };
}

export function getDateUIDFromFile(file: TFile | null): string {
  if (!file) {
    return null;
  }

  let date = getDateFromFile(file);
  if (date) {
    return getDateUID(date, "day");
  }

  // Check to see if the active note is a weekly-note
  const format = getWeeklyNoteSettings(get(settings)).format;
  date = window.moment(file.basename, format, true);
  if (date.isValid()) {
    return getDateUID(date, "week");
  }
  return null;
}

function createSelectedFileStore() {
  const store = writable<string>(null);

  return {
    setFile: (file: TFile) => {
      const id = getDateUIDFromFile(file);
      store.set(id);
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();
export const dailyNotes = createDailyNotesStore();
export const settings = writable<ISettings>({
  shouldConfirmBeforeCreate: true,
  weekStart: "locale",

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",
});
