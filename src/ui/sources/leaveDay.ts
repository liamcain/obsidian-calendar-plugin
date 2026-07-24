import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { get } from "svelte/store";

import { settings } from "../stores";

interface IDayMarker {
  date: string;
  name?: string;
}

interface IHolidayData {
  holidays?: IDayMarker[];
  leaveDays?: IDayMarker[];
  nonWorkingDays?: IDayMarker[];
}

type DayType = "holiday" | "leave" | "non-workday";

interface ICachedDayData {
  type: DayType;
  name: string;
}

// Cache: date string "YYYY-MM-DD" -> day data
let cachedData: Map<string, ICachedDayData> | null = null;
let cachedFileMtime: number | null = null;
let loadingPromise: Promise<Map<string, ICachedDayData>> | null = null;

async function loadHolidayData(
  filepath: string
): Promise<Map<string, ICachedDayData>> {
  const result = new Map<string, ICachedDayData>();

  if (!filepath) return result;

  const { vault } = window.app;
  const file = vault.getAbstractFileByPath(filepath);

  if (!file || !("stat" in file)) {
    return result;
  }

  const fileMtime = (file as any).stat.mtime;

  // Return cached data if file hasn't changed
  if (cachedData && cachedFileMtime === fileMtime) {
    return cachedData;
  }

  // Deduplicate concurrent loads
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const content = await vault.cachedRead(file as any);
      const data: IHolidayData = JSON.parse(content);

      (data.holidays || []).forEach((d) => {
        result.set(d.date, { type: "holiday", name: d.name || "节假日" });
      });
      (data.leaveDays || []).forEach((d) => {
        result.set(d.date, { type: "leave", name: d.name || "请假" });
      });
      (data.nonWorkingDays || []).forEach((d) => {
        result.set(d.date, {
          type: "non-workday",
          name: d.name || "非工作日",
        });
      });

      cachedData = result;
      cachedFileMtime = fileMtime;
    } catch (err) {
      console.warn("[Calendar] Failed to load holiday data:", err);
    }

    return result;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function getDayType(
  date: Moment
): Promise<ICachedDayData | null> {
  const { holidayFilepath } = get(settings);
  if (!holidayFilepath) return null;

  const data = await loadHolidayData(holidayFilepath);
  const dateStr = date.format("YYYY-MM-DD");
  return data.get(dateStr) || null;
}

export const leaveDaySource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const dayData = await getDayType(date);
    if (!dayData) return { dots: [] };

    const classes: string[] = [];
    const dataAttributes: Record<string, string> = {};

    switch (dayData.type) {
      case "holiday":
        classes.push("is-holiday");
        dataAttributes["data-day-marker"] = "holiday";
        dataAttributes["data-day-marker-name"] = dayData.name;
        break;
      case "leave":
        classes.push("is-leave-day");
        dataAttributes["data-day-marker"] = "leave";
        dataAttributes["data-day-marker-name"] = dayData.name;
        break;
      case "non-workday":
        classes.push("is-nonworkday");
        dataAttributes["data-day-marker"] = "non-workday";
        dataAttributes["data-day-marker-name"] = dayData.name;
        break;
    }

    return { classes, dots: [], dataAttributes };
  },
  getWeeklyMetadata: async (): Promise<IDayMetadata> => {
    return { dots: [] };
  },
};

/**
 * Invalidate the cached holiday data.
 * Call this when the holiday JSON file is modified.
 */
export function invalidateHolidayCache(): void {
  cachedData = null;
  cachedFileMtime = null;
}
