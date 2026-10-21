import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import { get } from "svelte/store";

import { getCanvasSchedulesForDay } from "src/io/canvasSchedules";
import { canvasSchedules, settings } from "../stores";

/**
 * Get the dots for a given day based on canvas schedules.
 * Mirrors the monthly tasks source: a dot is shown when the day
 * has at least one schedule entry.
 */
async function getDotsForCanvasSchedules(date: Moment): Promise<IDot[]> {
  if (!get(settings)?.showCanvasSchedules) {
    return [];
  }
  const schedules = get(canvasSchedules);
  if (!schedules) {
    return [];
  }
  const daySchedules = getCanvasSchedulesForDay(date, schedules);
  if (daySchedules.length === 0) {
    return [];
  }
  const currentSettings = get(settings);
  return [
    {
      className: "canvas-schedule",
      color: currentSettings?.canvasSchedulesDotColor || "#3498db",
      isFilled: true,
    },
  ];
}

export const canvasSchedulesSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const dots = await getDotsForCanvasSchedules(date);
    return { dots };
  },

  getWeeklyMetadata: async (_date: Moment): Promise<IDayMetadata> => {
    // Canvas schedules are shown per-day only, not on the week column.
    return { dots: [] };
  },
};