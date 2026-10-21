import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import { get } from "svelte/store";

import { monthlyNotes, settings } from "../stores";
import { getMonthlyNote, parseMonthlyNoteSections } from "src/io/monthlyNotes";

/**
 * Check if a date's day has any content in the monthly note.
 */
async function getDotsForMonthlyNote(
  date: Moment,
  monthlyNotesMap: Record<string, TFile>
): Promise<IDot[]> {
  const monthKey = date.format("YYYY-MM");
  const file = getMonthlyNote(date, monthlyNotesMap);

  if (!file) {
    return [];
  }

  try {
    const content = await window.app.vault.cachedRead(file);
    const sections = parseMonthlyNoteSections(content, monthKey);
    const dayKey = date.format("DD");

    if (sections[dayKey] && sections[dayKey].trim().length > 0) {
      const currentSettings = get(settings);
      const dotColor = currentSettings?.monthlyDotColor || "#9b59b6";
      return [
        {
          className: "monthly-task",
          color: dotColor,
          isFilled: true,
        },
      ];
    }
  } catch (err) {
    // Ignore read errors
  }

  return [];
}

export const monthlyTasksSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const notes = get(monthlyNotes);
    if (!notes) {
      return { dots: [] };
    }
    const dots = await getDotsForMonthlyNote(date, notes);
    return { dots };
  },

  getWeeklyMetadata: async (_date: Moment): Promise<IDayMetadata> => {
    return { dots: [] };
  },
};
