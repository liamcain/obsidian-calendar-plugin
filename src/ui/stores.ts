import type { TFile } from "obsidian";
import {
  getAllDailyNotes,
  getAllMonthlyNotes,
  getAllWeeklyNotes,
} from "obsidian-daily-notes-interface";
import { get, writable } from "svelte/store";

import { defaultSettings, ISettings } from "src/settings";

import { getDateUIDFromFile } from "./utils";
import type { ICalendarSource } from "obsidian-calendar-ui";

function createDailyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      try {
        const dailyNotes = getAllDailyNotes();
        store.set(dailyNotes);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find daily notes folder", err);
        }
        store.set({});
        hasError = true;
      }
    },
    ...store,
  };
}

function createWeeklyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      try {
        const weeklyNotes = getAllWeeklyNotes();
        store.set(weeklyNotes);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find weekly notes folder", err);
        }
        store.set({});
        hasError = true;
      }
    },
    ...store,
  };
}

function createMonthlyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      try {
        const monthlyNotes = getAllMonthlyNotes();
        store.set(monthlyNotes);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find monthly notes folder", err);
        }
        store.set({});
        hasError = true;
      }
    },
    ...store,
  };
}

function createSettingsStore() {
  const store = writable<ISettings>(defaultSettings);
  return {
    getSourceSettings: <T>(sourceId: string): T =>
      ((get(store).sourceSettings[sourceId] || {}) as unknown) as T,
    ...store,
  };
}
export const settings = createSettingsStore();
export const dailyNotes = createDailyNotesStore();
export const weeklyNotes = createWeeklyNotesStore();
export const monthlyNotes = createMonthlyNotesStore();

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

function createSourcesStore() {
  const store = writable<ICalendarSource[]>([]);

  return {
    registerSource: (source: ICalendarSource) => {
      store.update((val: ICalendarSource[]) => {
        val.push(source);
        return val;
      });
    },
    ...store,
  };
}
export const sources = createSourcesStore();
