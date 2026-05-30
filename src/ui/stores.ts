import type { TFile } from "obsidian";
import {
  getAllDailyNotes,
  getAllWeeklyNotes,
} from "obsidian-daily-notes-interface";
import { get, writable } from "svelte/store";

import { defaultSettings, ISettings } from "src/settings";
import {
  buildDailyNotesByDate,
  DailyNotesByDate,
  dailyNotesByDateToSingleNotes,
  singleDailyNotesToDailyNotesByDate,
} from "src/io/dailyNoteIndex";

import { getDateUIDFromFile } from "./utils";

export const settings = writable<ISettings>(defaultSettings);
export const dailyNotesByDate = writable<DailyNotesByDate>({});

function createDailyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      try {
        const shouldIndexAllFolders = get(
          settings
        ).shouldIndexDailyNotesInAllFolders;
        const notesByDate = shouldIndexAllFolders
          ? buildDailyNotesByDate(
              window.app.vault.getMarkdownFiles(),
              {
                filenameDateFormat: get(settings).dailyNoteFilenameDateFormat,
                frontmatterDateFields: get(settings)
                  .shouldIndexDailyNotesFromFrontmatter
                  ? get(settings).dailyNoteFrontmatterDateFields
                  : "",
                includedFolders: get(settings).dailyNoteIncludedFolders,
              }
            )
          : singleDailyNotesToDailyNotesByDate(getAllDailyNotes());
        const dailyNotes = dailyNotesByDateToSingleNotes(notesByDate);

        store.set(dailyNotes);
        dailyNotesByDate.set(notesByDate);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find daily notes folder", err);
        }
        store.set({});
        dailyNotesByDate.set({});
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

export const dailyNotes = createDailyNotesStore();
export const weeklyNotes = createWeeklyNotesStore();

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
