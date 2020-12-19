import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { writable } from "svelte/store";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";
import type { ISettings } from "src/settings";

export const activeFile = writable<TFile>(null);
export const displayedMonth = writable<Moment>(null);
export const settings = writable<ISettings>({
  shouldConfirmBeforeCreate: true,
  weekStart: "locale",

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",
});
