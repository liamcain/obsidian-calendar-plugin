import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";

export function getNumBacklinks(note: TFile): number {
  if (!note) {
    return 0;
  }

  return Object.values(window.app.metadataCache.resolvedLinks).reduce(
    (acc, links) => acc + (links[note.path] || 0),
    0
  );
}

export const backlinksSource: ICalendarSource = {
  id: "backlinks",
  name: "Backlinks",

  getMetadata: async (
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const numBacklinks = getNumBacklinks(file);

    return {
      dots: [],
      value: numBacklinks,
    };
  },

  defaultSettings: Object.freeze({
    color: "#5e81ac",
    display: "menu",
  }),
};
