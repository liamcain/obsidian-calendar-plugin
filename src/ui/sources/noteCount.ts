import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import { getWeeklyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { getDailyNotesForDate } from "src/io/dailyNoteIndex";

import { dailyNotes, dailyNotesByDate, weeklyNotes } from "../stores";

const NUM_MAX_DOTS = 5;

export function getNoteCountAsDots(noteCount: number): IDot[] {
  const numSolidDots = Math.min(Math.max(noteCount, 0), NUM_MAX_DOTS);
  const dots = [];

  for (let i = 0; i < numSolidDots; i++) {
    dots.push({
      color: "default",
      isFilled: true,
    });
  }

  return dots;
}

export const noteCountSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const notes = getDailyNotesForDate(
      date,
      get(dailyNotesByDate),
      get(dailyNotes)
    );

    return {
      dots: getNoteCountAsDots(notes.length),
    };
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));

    return {
      dots: getNoteCountAsDots(file ? 1 : 0),
    };
  },
};
