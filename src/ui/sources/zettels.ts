import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";

export function getNumZettels(date: Moment): number {
  const zettelPrefix = date.format("YYYYMMDD");
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
    date: Moment,
    _file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const numZettels = getNumZettels(date);

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
