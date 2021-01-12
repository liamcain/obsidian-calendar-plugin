import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { getWeeklyNote } from "src/io/weeklyNotes";

import { dailyNotes, settings } from "../stores";
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
    const file = getWeeklyNote(date, get(settings));
    return {
      classes: getStreakClasses(file),
      dots: [],
    };
  },
};
