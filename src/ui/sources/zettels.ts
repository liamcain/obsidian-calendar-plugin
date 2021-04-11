import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";
import type { IGranularity } from "obsidian-daily-notes-interface";

import { filledDots } from "./utils";

export function getNumZettels(granularity: IGranularity, date: Moment): number {
  if (granularity !== "day") {
    return 0;
  }
  const zettelPrefix = date.format("YYYYMMDD");
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
    granularity: IGranularity,
    date: Moment,
    _file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const numZettels = getNumZettels(granularity, date);

    return {
      dots: filledDots(numZettels),
      value: numZettels,
    };
  },

  defaultSettings: Object.freeze({
    color: "#b48ead",
    display: "calendar-and-menu",
  }),
};
