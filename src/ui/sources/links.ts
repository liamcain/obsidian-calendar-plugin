import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IEvaluatedMetadata } from "obsidian-calendar-ui";
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

async function getMetadata(file: TFile): Promise<IEvaluatedMetadata> {
  const wordCount = getNumLinks(file);

  return {
    dots: [],
    value: wordCount,
  };
}

export const linksSource: ICalendarSource = {
  id: "links",
  name: "Links",

  getDailyMetadata: async (date: Moment): Promise<IEvaluatedMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return getMetadata(file);
  },

  getWeeklyMetadata: async (date: Moment): Promise<IEvaluatedMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));
    return getMetadata(file);
  },

  getMonthlyMetadata: async (date: Moment): Promise<IEvaluatedMetadata> => {
    const file = getMonthlyNote(date, get(monthlyNotes));
    return getMetadata(file);
  },

  defaultSettings: Object.freeze({
    color: "#a3be8c",
    display: "menu",
  }),
};
