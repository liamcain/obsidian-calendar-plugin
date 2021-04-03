import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";
import { getDateFromFile } from "obsidian-daily-notes-interface";

export function getNumZettels(note: TFile): number {
  if (!note) {
    return 0;
  }

  const zettelPrefix = getDateFromFile(note, "day")?.format("YYYYMMDD");
  if (!zettelPrefix) {
    return 0;
  }

  return window.app.vault
    .getMarkdownFiles()
    .filter((file) => file.name.startsWith(zettelPrefix)).length;
}

export const zettelsSource: ICalendarSource = {
  id: "zettels",
  name: "Zettels",
  description:
    "Show how many notes use a Zettelkasten prefix matching the current day",

  getMetadata: async (
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const numZettels = getNumZettels(file);

    return {
      dots: [],
      value: numZettels,
    };
  },

  defaultSettings: Object.freeze({
    color: "#b48ead",
    display: "calendar-and-menu",
  }),
};
