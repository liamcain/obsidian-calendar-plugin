import { ISettings, syncMomentLocaleWithSettings } from "src/settings";

export function getDefaultSettings(
  overrides: Partial<ISettings> = {}
): ISettings {
  const settings = Object.assign(
    {},
    {
      shouldStartWeekOnMonday: false,
      shouldConfirmBeforeCreate: false,
      wordsPerDot: 50,
      showWeeklyNote: false,
      weeklyNoteFolder: "",
      weeklyNoteFormat: "",
      weeklyNoteTemplate: "",
    },
    overrides
  );
  syncMomentLocaleWithSettings(settings);

  return settings;
}
