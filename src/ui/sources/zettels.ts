import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { getDailyNote, getDateFromFile } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { dailyNotes } from "../stores";

export function getNumZettels(note: TFile): number {
  if (!note) {
    return 0;
  }

  const zettelPrefix = getDateFromFile(note, "day").format("YYYYMMDD");
  return window.app.vault
    .getMarkdownFiles()
    .filter((file) => file.name.startsWith(zettelPrefix)).length;
}

async function getMetadata(file: TFile): Promise<IDayMetadata> {
  const numZettels = getNumZettels(file);

  return {
    color: "#7FA1C0",
    isShowcased: false,
    minDots: 0,
    maxDots: 1,
    name: "Zettels",
    value: numZettels,
    valueToDotRadio: 0,
  };
}

export const zettelsSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return getMetadata(file);
  },
};
