import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { getDailyNote, getWeeklyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { dailyNotes, weeklyNotes } from "../stores";
import { classList } from "../utils";

const getStreakClasses = (file: TFile): string[] => {
  return classList({
    "has-note": !!file,
  });
};

export const streakSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return {
      classes: getStreakClasses(file),
      dots: [],
    };
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));
    return {
      classes: getStreakClasses(file),
      dots: [],
    };
  },
};
