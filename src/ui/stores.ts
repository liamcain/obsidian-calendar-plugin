import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable } from "svelte/store";
import { getAllDailyNotes, getDateUID } from "obsidian-daily-notes-interface";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";
import type { ISettings } from "src/settings";

import type { CalendarSource, IDayMetadata } from "./sources/CalendarSource";

export class DailyNoteMetadataCache {
  private cache: Record<string, IDayMetadata>;
  private source: CalendarSource;

  constructor() {
    this.cache = {};
  }

  addSource(source: CalendarSource): void {
    this.source = source;
  }

  set(date: Moment, metadata: IDayMetadata): void {
    const key = getDateUID(date);
    this.cache = Object.assign(
      {},
      {
        [key]: metadata,
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(date: Moment, ..._args: any[]): IDayMetadata {
    const dateStr = getDateUID(date);
    let value = this.cache[dateStr];
    if (value) {
      return value;
    }
    value = this.source.getMetadata(date);
    this.set(date, value);
    return value;
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
