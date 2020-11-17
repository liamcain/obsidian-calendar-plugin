import * as os from "os";
import type { TFile } from "obsidian";
import type { IMoment } from "../moment";

const NUM_MAX_DOTS = 6;

function clamp(num: number, lowerBound: number, upperBound: number) {
  return Math.min(Math.max(lowerBound, num), upperBound);
}

function isNumber(possibleNumber: any) {
  return !isNaN(possibleNumber) && isFinite(possibleNumber);
}

export function getNumberOfDots(dailyNoteFile?: TFile): number {
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

  const numDots = Math.floor(Math.log(fileSize / 30));
  return isNumber(numDots) ? clamp(numDots, 1, NUM_MAX_DOTS) : 0;
}

function isMacOS() {
  return os.platform() === "darwin";
}

export function isMetaPressed(e: MouseEvent) {
  return isMacOS() ? e.metaKey : e.ctrlKey;
}

export interface IDay {
  date: IMoment;
  dayOfMonth: number;
  formattedDate: string;
  numDots: number;
  notePath: string;
}

export type IWeek = IDay[];

export function getWeekNumber(week: IWeek): string {
  const day = week.find((day) => !!day.date);
  return day ? String(day.date.week()) : "";
}
