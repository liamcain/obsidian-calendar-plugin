import type { Moment } from "moment";
import * as os from "os";
import type { TFile, Vault } from "obsidian";

import { getNotePath } from "src/io/path";
import { getDailyNoteSettings } from "src/io/dailyNotes";
import type { ISettings } from "src/settings";

const NUM_MAX_DOTS = 5;

export interface IDay {
  date: Moment;
  dayOfMonth: number;
  formattedDate: string;
  numTasksRemaining: Promise<number>;
  numDots: number;
  notePath: string;
}

export type IWeek = IDay[];
export type IMonth = IWeek[];

function clamp(num: number, lowerBound: number, upperBound: number) {
  return Math.min(Math.max(lowerBound, num), upperBound);
}

function isNumber(possibleNumber: number): boolean {
  return !isNaN(possibleNumber) && isFinite(possibleNumber);
}

function getNumberOfDots(dailyNoteFile?: TFile): number {
  if (!dailyNoteFile) {
    return 0;
  }
  const fileSize = dailyNoteFile.stat.size;
  if (!fileSize) {
    return 0;
  }
  if (typeof fileSize === "bigint") {
    return NUM_MAX_DOTS;
  }

  const numDots = Math.floor(Math.log(fileSize / 40));
  return isNumber(numDots) ? clamp(numDots, 1, NUM_MAX_DOTS) : 0;
}

async function getNumberOfRemainingTasks(
  dailyNoteFile?: TFile
): Promise<number> {
  if (!dailyNoteFile) {
    return 0;
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(dailyNoteFile);
  return (fileContents.match(/- \[ \]/g) || []).length;
}

function isMacOS() {
  return os.platform() === "darwin";
}

export function isMetaPressed(e: MouseEvent): boolean {
  return isMacOS() ? e.metaKey : e.ctrlKey;
}

export function getWeekNumber(week: IWeek): string {
  const day = week.find((day) => !!day.date);
  return day ? String(day.date.week()) : "";
}

export function getDaysOfWeek(settings: ISettings): string[] {
  const [sunday, ...restOfWeek] = window.moment.weekdaysShort();
  return settings.shouldStartWeekOnMonday
    ? [...restOfWeek, sunday]
    : [sunday, ...restOfWeek];
}

/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
export function getMonthData(
  displayedMonth: Moment,
  settings: ISettings,
  vault: Vault
): IMonth {
  console.log("get month data");
  const month = [];
  const dailyNoteSettings = getDailyNoteSettings();

  const startDate = displayedMonth.clone().date(1);
  const endDayOfMonth = startDate.daysInMonth();
  const startOffset = settings.shouldStartWeekOnMonday
    ? startDate.weekday() + 1
    : startDate.weekday();

  // todo start on monday is broken

  console.log(
    "startOffset",
    startOffset,
    startDate.weekday(),
    settings.shouldStartWeekOnMonday,
    startDate
  );

  let dayOfMonth = 1;
  for (let weekNum = 0; weekNum <= 5; weekNum++) {
    const week = [];
    month.push(week);

    for (let weekday = 1; weekday <= 7; weekday++) {
      // Insert empty objects for spacers
      if (weekNum * 6 + weekday < startOffset || dayOfMonth > endDayOfMonth) {
        week.push({});
        continue;
      }

      const date: Moment = displayedMonth.clone().date(dayOfMonth);
      const formattedDate = date.format(dailyNoteSettings.format);
      const dailyNotePath = getNotePath(
        dailyNoteSettings.folder,
        formattedDate
      );
      const fileForDay = vault.getAbstractFileByPath(dailyNotePath) as TFile;

      week.push({
        date,
        dayOfMonth,
        formattedDate,
        numDots: getNumberOfDots(fileForDay),
        numTasksRemaining: getNumberOfRemainingTasks(fileForDay),
        notePath: dailyNotePath,
      });

      dayOfMonth++;
    }

    if (dayOfMonth > startDate.daysInMonth()) {
      break;
    }
  }

  return month;
}
