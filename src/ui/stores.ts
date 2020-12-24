import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable } from "svelte/store";
import { getAllDailyNotes } from "obsidian-daily-notes-interface";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";
import type { ISettings } from "src/settings";
import { MetadataCache } from "obsidian-calendar-ui";

function createDailyNotesStore() {
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => store.set(getAllDailyNotes()),
    ...store,
  };
}

function createDisplayedMonthStore() {
  const store = writable<Moment>(null);
  return {
    reset: () => store.set(window.moment()),
    increment: () => store.update((month) => month.clone().add(1, "months")),
    decrement: () =>
      store.update((month) => month.clone().subtract(1, "months")),
    ...store,
  };
}

export const activeFile = writable<TFile>(null);
export const displayedMonth = createDisplayedMonthStore();
export const metadata = new MetadataCache();
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
