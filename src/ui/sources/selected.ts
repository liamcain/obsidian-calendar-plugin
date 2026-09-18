import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { get } from "svelte/store";

import { selectedDate } from "../stores";

export const selectedDateSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const sel = get(selectedDate);
    // apenas o dia explicitamente clicado recebe borda; hoje não recebe borda automaticamente
    if (!sel) {
      return { classes: [], dots: [] };
    }
    const dateStr = date.format("YYYY-MM-DD");
    if (sel === dateStr) {
      return {
        classes: ["agenda-selected"],
        dots: [],
      };
    }
    return { classes: [], dots: [] };
  },
  getWeeklyMetadata: async (): Promise<IDayMetadata> => {
    return { classes: [], dots: [] };
  },
};
