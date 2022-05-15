import type {
  ILocaleOverride,
  ISourceSettings,
  IWeekStartOption,
} from "obsidian-calendar-ui";

export type IWeekNumberingPreference = "locale" | "iso-8601";
export interface ISettings {
  shouldConfirmBeforeCreate: boolean;
  // localeOverride: ILocaleOverride;
  // weekStart: IWeekStartOption;
  weekNumberingPreference: IWeekNumberingPreference;

  showWeeklyNote: boolean;
  sourceSettings: Record<string, ISourceSettings>;
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  localeOverride: "system-default",
  weekStart: "locale" as IWeekStartOption,

  showWeeklyNote: false,
  weekNumberingPreference: "locale",
  sourceSettings: {},
});
