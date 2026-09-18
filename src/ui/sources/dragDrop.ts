import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";

export const dragDropSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    return {
      classes: [],
      dots: [],
      dataAttributes: {
        "data-date": date.format("YYYY-MM-DD"),
      },
    };
  },
  getWeeklyMetadata: async (): Promise<IDayMetadata> => {
    return { classes: [], dots: [] };
  },
};