import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import {
  getDailyNote,
  getMonthlyNote,
  getWeeklyNote,
} from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { dailyNotes, monthlyNotes, weeklyNotes } from "../stores";

export function getNumLinks(note: TFile): number {
  if (!note) {
    return 0;
  }
  return window.app.metadataCache.getCache(note.path)?.links?.length || 0;
}

async function getMetadata(file: TFile): Promise<IDayMetadata> {
  const wordCount = getNumLinks(file);

  return {
    name: "Links",
    value: wordCount,
    color: "#7FA1C0",
    isShowcased: false,
  };
}

export const linksSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return getMetadata(file);
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));
    return getMetadata(file);
  },

  getMonthlyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getMonthlyNote(date, get(monthlyNotes));
    return getMetadata(file);
  },
};
