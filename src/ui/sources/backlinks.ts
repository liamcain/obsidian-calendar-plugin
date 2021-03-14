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

export function getNumBacklinks(note: TFile): number {
  if (!note) {
    return 0;
  }

  return Object.values(window.app.metadataCache.resolvedLinks).reduce(
    (acc, links) => acc + (links[note.path] || 0),
    0
  );
}

async function getMetadata(file: TFile): Promise<IEvaluatedMetadata> {
  const numBacklinks = getNumBacklinks(file);

  return {
    dots: [],
    value: numBacklinks,
  };
}

export const backlinksSource: ICalendarSource = {
  id: "backlinks",
  name: "Backlinks",

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
    color: "#5e81ac",
    display: "menu",
  }),
};
