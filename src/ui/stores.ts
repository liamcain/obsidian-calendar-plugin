import type { TFile } from "obsidian";
import {
  getAllDailyNotes,
  getAllWeeklyNotes,
} from "obsidian-daily-notes-interface";
import { writable } from "svelte/store";

import { defaultSettings, ISettings } from "src/settings";
import { getAllMonthlyNotes } from "src/io/monthlyNotes";
import { getAllCanvasSchedules } from "src/io/canvasSchedules";
import type { CanvasSchedule } from "src/io/canvasSchedules";
import { t } from "../i18n";

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
          console.log(t('error.dailyNotesFolder'), err);
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
          console.log(t('error.weeklyNotesFolder'), err);
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
          console.log(t('error.monthlyNotesFolder'), err);
        }
        store.set({});
        hasError = true;
      }
    },
    ...store,
  };
}

function createCanvasSchedulesStore() {
  let hasError = false;
  const store = writable<Record<string, CanvasSchedule[]>>(null);
  return {
    reindex: async (settings: ISettings) => {
      try {
        const schedules = await getAllCanvasSchedules(settings);
        store.set(schedules);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          console.log(t('error.canvasSchedules'), err);
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
export const monthlyNotes = createMonthlyNotesStore();
export const canvasSchedules = createCanvasSchedulesStore();

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
