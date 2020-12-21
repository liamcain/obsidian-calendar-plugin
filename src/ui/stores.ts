import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable, Writable } from "svelte/store";
import {
  getAllDailyNotes,
  getDateFromFile,
  getDateUID,
} from "obsidian-daily-notes-interface";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";
import type { ISettings } from "src/settings";

import type { IDayMetadata } from "./sources/CalendarSource";

export class DailyNoteMetadataCache {
  private cache: Record<string, IDayMetadata>;

  constructor() {
    this.cache = {};
  }

  // generate

  add(file: TFile, value: IDayMetadata): Writable<string> {
    const key = getDateUID(getDateFromFile(file));
    const store = writable<string>(value);
    this.cache[key] = store;
    return store;
  }

  set(file: TFile, value: string): void {
    const key = getDateUID(getDateFromFile(file));
    this.cache[key].set(value);
  }

  get(key: string): Writable<string> {
    return this.cache[key];
  }

  reset(): void {
    this.cache = {};
  }
}

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
    increment: () => store.update((month) => month.add(1, "months")),
    decrement: () => store.update((month) => month.subtract(1, "months")),
    ...store,
  };
}

export const activeFile = writable<TFile>(null);
export const displayedMonth = createDisplayedMonthStore();
export const dayCache = new DailyNoteMetadataCache();
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
