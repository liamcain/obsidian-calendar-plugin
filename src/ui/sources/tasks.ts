import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { getWeeklyNote } from "src/io/weeklyNotes";

import { dailyNotes, settings } from "../stores";

export async function getNumberOfRemainingTasks(note: TFile): Promise<number> {
  if (!note) {
    return 0;
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(note);
  return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
}

export async function getDotsForDailyNote(
  dailyNote: TFile | null
): Promise<IDot[]> {
  if (!dailyNote) {
    return [];
  }
  const numHollowDots = await getNumberOfRemainingTasks(dailyNote);

  const dots = [];
  for (let i = 0; i < numHollowDots; i++) {
    dots.push({
      color: "default",
      isFilled: false,
    });
  }

  return dots;
}

export const tasksSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    const dots = await getDotsForDailyNote(file);
    return {
      dots,
    };
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(settings));
    const dots = await getDotsForDailyNote(file);

    return {
      dots,
    };
  },
};
