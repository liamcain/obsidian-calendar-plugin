import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  getAllDailyNotes,
  getAllWeeklyNotes,
  getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";
import { writable } from "svelte/store";

import { hasWeeklyYearInDirectory } from "src/io/weeklyNotes";
import { defaultSettings, ISettings } from "src/settings";

import { getDateUIDFromFile } from "./utils";

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
        const { format } = getWeeklyNoteSettings();
        const weeklyNotes = hasWeeklyYearInDirectory(format)
          ? {}
          : getAllWeeklyNotes();
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

export const settings = writable<ISettings>(defaultSettings);
export const dailyNotes = createDailyNotesStore();
export const weeklyNotes = createWeeklyNotesStore();

function createSelectedFileStore() {
  const store = writable<string>(null);

  return {
    setFile: (file: TFile, selectedWeek?: Moment) => {
      const id = getDateUIDFromFile(file, selectedWeek);
      store.set(id);
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();
