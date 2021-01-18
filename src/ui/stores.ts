import type { TFile } from "obsidian";
import { writable } from "svelte/store";
import { getAllDailyNotes } from "obsidian-daily-notes-interface";

import { defaultSettings, ISettings } from "src/settings";

import { getDateUIDFromFile } from "./utils";

function createDailyNotesStore() {
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => store.set(getAllDailyNotes()),
    ...store,
  };
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
export const settings = writable<ISettings>(defaultSettings);
