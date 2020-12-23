import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable } from "svelte/store";
import { getAllDailyNotes, getDateUID } from "obsidian-daily-notes-interface";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";
import type { ISettings } from "src/settings";

import type {
  CalendarSource,
  IDayMetadata,
  IWeekMetadata,
} from "./sources/CalendarSource";

export class DailyNoteMetadataCache {
  private dailyCache: Record<string, IDayMetadata>;
  private weeklyCache: Record<string, IWeekMetadata>;

  private source: CalendarSource;

  constructor() {
    this.dailyCache = {};
    this.weeklyCache = {};
  }

  addSource(source: CalendarSource): void {
    this.source = source;
  }

  setDailyMetadata(date: Moment, metadata: IDayMetadata): void {
    const key = getDateUID(date);
    this.dailyCache = Object.assign(
      {},
      {
        [key]: metadata,
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDailyMetadata(date: Moment, ..._args: any[]): IDayMetadata {
    const dateStr = getDateUID(date);
    let value = this.dailyCache[dateStr];
    if (value) {
      return value;
    }
    value = this.source.getDailyMetadata(date);
    this.setDailyMetdata(date, value);
    return value;
  }

  setWeeklyMetadata(date: Moment, metadata: IDayMetadata): void {
    const key = getDateUID(date);
    this.weeklyCache = Object.assign(
      {},
      {
        [key]: metadata,
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getWeeklyMetdata(date: Moment, ..._args: any[]): IDayMetadata {
    const dateStr = getDateUID(date);
    let value = this.weeklyCache[dateStr];
    if (value) {
      return value;
    }
    value = this.source.getWeeklyMetadata(date);
    this.setWeeklyMetadata(date, value);
    return value;
  }

  reset(): void {
    this.dailyCache = {};
    this.weeklyCache = {};
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
