import moment, { Moment } from "moment";
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
  numDots: Promise<number>;
  notePath: string;
}

export type IWeek = IDay[];
export type IMonth = IWeek[];

function clamp(num: number, lowerBound: number, upperBound: number) {
  return Math.min(Math.max(lowerBound, num), upperBound);
}

function getWordCount(text: string): number {
  const matches = text.match(
    /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/gm
  );

  if (!matches) {
    return 0;
  }

  let wordCount = 0;
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].charCodeAt(0) > 19968) {
      wordCount += matches[i].length;
    } else {
      wordCount += 1;
    }
  }
  return wordCount;
}

async function getNumberOfDots(
  dailyNoteFile: TFile | null,
  settings: ISettings
): Promise<number> {
  if (!dailyNoteFile || settings.wordsPerDot <= 0) {
    return 0;
  }
  const fileContents = await window.app.vault.cachedRead(dailyNoteFile);
  const numDots = getWordCount(fileContents) / settings.wordsPerDot;
  return clamp(Math.floor(numDots), 1, NUM_MAX_DOTS);
}

async function getNumberOfRemainingTasks(
  dailyNoteFile?: TFile
): Promise<number> {
  if (!dailyNoteFile) {
    return 0;
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(dailyNoteFile);
  return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
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
  const [sunday, ...restOfWeek] = moment.weekdaysShort();
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
  const month = [];
  const dailyNoteSettings = getDailyNoteSettings();

  const startDate = displayedMonth.clone().date(1);
  const endDayOfMonth = startDate.daysInMonth();
  const startOffset = settings.shouldStartWeekOnMonday
    ? startDate.isoWeekday()
    : startDate.weekday() + 1;

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
        numDots: getNumberOfDots(fileForDay, settings),
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
