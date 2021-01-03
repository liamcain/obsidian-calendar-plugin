import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable } from "svelte/store";
import {
  getAllDailyNotes,
  getDateFromFile,
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

function createDisplayedMonthStore() {
  const store = writable<Moment>(window.moment());
  return {
    reset: () => store.set(window.moment()),
    increment: () => store.update((month) => month.clone().add(1, "months")),
    decrement: () =>
      store.update((month) => month.clone().subtract(1, "months")),
    ...store,
  };
}

export function getDateUIDFromFile(file: TFile | null): string {
  if (!file) {
    return null;
  }

  let date = getDateFromFile(file);
  if (date) {
    return `day-${date.startOf("day").format()}`;
  }

  // Check to see if the active note is a weekly-note
  const format = getWeeklyNoteSettings(this.settings).format;
  date = window.moment(file.basename, format, true);
  if (date.isValid()) {
    return `week-${date.startOf("week").format()}`;
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
export const displayedMonth = createDisplayedMonthStore();
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
