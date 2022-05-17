import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";
import type { IGranularity } from "obsidian-daily-notes-interface";

import { filledDots } from "./utils";

export function getNumLinks(note: TFile): number {
  if (!note) {
    return 0;
  }
  return window.app.metadataCache.getCache(note.path)?.links?.length || 0;
}

export const linksSource: ICalendarSource = {
  id: "links",
  name: "Links",

  getMetadata: async (
    _granularity: IGranularity,
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const numLinks = getNumLinks(file);

    return {
      dots: filledDots(numLinks),
      value: numLinks,
    };
  },

  defaultSettings: Object.freeze({
    color: "#a3be8c",
    enabled: false,
  }),
};
