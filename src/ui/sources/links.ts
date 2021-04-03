import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";

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
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const wordCount = getNumLinks(file);

    return {
      dots: [],
      value: wordCount,
    };
  },

  defaultSettings: Object.freeze({
    color: "#a3be8c",
    display: "menu",
  }),
};
