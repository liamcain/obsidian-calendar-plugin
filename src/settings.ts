import type {
  ILocaleOverride,
  ISourceSettings,
  IWeekStartOption,
} from "obsidian-calendar-ui";

export interface ISettings {
  shouldConfirmBeforeCreate: boolean;
  localeOverride: ILocaleOverride;
  weekStart: IWeekStartOption;

  showWeeklyNote: boolean;
  sourceSettings: Record<string, ISourceSettings>;
}

export const defaultSettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  localeOverride: "system-default",
  weekStart: "locale" as IWeekStartOption,

  showWeeklyNote: false,
  sourceSettings: {},
});
