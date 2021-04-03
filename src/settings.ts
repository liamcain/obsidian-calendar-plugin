import type {
  ILocaleOverride,
  ISourceSettings,
  IWeekStartOption,
} from "obsidian-calendar-ui";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";

export interface ISettings {
  wordsPerDot: number;
  shouldConfirmBeforeCreate: boolean;
  showWeeklyNote: boolean;

  weekStart: IWeekStartOption;
  localeOverride: ILocaleOverride;

  sourceSettings: Record<string, ISourceSettings>;
}

export const defaultSettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default",

  sourceSettings: {},
});
