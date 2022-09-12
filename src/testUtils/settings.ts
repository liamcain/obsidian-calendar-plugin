import type { ISettings } from "src/settings";

export function getDefaultSettings(
  overrides: Partial<ISettings> = {}
): ISettings {
  return Object.assign(
    {},
    {
      weekStart: "sunday",
      shouldConfirmBeforeCreate: false,
      wordsPerDot: 50,
      showWeeklyNote: false,
      showWeeklyNoteRight: false,
      weeklyNoteFolder: "",
      weeklyNoteFormat: "",
      weeklyNoteTemplate: "",
    },
    overrides
  );
}
