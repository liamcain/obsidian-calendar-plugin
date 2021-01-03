import type { Moment } from "moment";
import { parseFrontMatterTags, TFile } from "obsidian";
import type {
  ICalendarSource,
  IDayMetadata,
  IWeekMetadata,
  IDot,
} from "obsidian-calendar-ui";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { getWeeklyNote } from "src/io/weeklyNotes";
import { clamp, getWordCount } from "src/ui/utils";

import { dailyNotes, settings } from "../stores";

const NUM_MAX_DOTS = 5;

export async function getWordLengthAsDots(note: TFile): Promise<number> {
  const { wordsPerDot } = get(settings);
  if (!note || wordsPerDot <= 0) {
    return 0;
  }
  const fileContents = await window.app.vault.cachedRead(note);

  const numDots = getWordCount(fileContents) / wordsPerDot;
  return clamp(Math.floor(numDots), 1, NUM_MAX_DOTS);
}

export function getNoteTags(note: TFile | null): string[] {
  if (!note) {
    return [];
  }

  const { metadataCache } = window.app;
  const frontmatter = metadataCache.getFileCache(note)?.frontmatter;

  const tags = [];

  if (frontmatter) {
    const frontmatterTags = parseFrontMatterTags(frontmatter) || [];
    tags.push(...frontmatterTags);
  }

  return tags.map((tag) => tag.substring(1));
}

export async function getNumberOfRemainingTasks(note: TFile): Promise<number> {
  if (!note) {
    return 0;
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(note);
  return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
}

export async function getDotsForDailyNote(
  dailyNote: TFile | null
): Promise<IDot[]> {
  if (!dailyNote) {
    return [];
  }
  const numSolidDots = await getWordLengthAsDots(dailyNote);
  const numHollowDots = await getNumberOfRemainingTasks(dailyNote);

  const dots = [];
  for (let i = 0; i < numSolidDots; i++) {
    dots.push({
      color: "default",
      isFilled: true,
    });
  }
  for (let i = 0; i < numHollowDots; i++) {
    dots.push({
      color: "default",
      isFilled: false,
    });
  }

  return dots;
}

const classList = (obj: Record<string, boolean>): string[] => {
  return Object.entries(obj)
    .filter(([_k, v]) => !!v)
    .map(([k, _k]) => k);
};

const getStreakClasses = (file: TFile): string[] => {
  return classList({
    "has-note": !!file,
  });
};

export const dailyNoteSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    const dots = await getDotsForDailyNote(file);
    return {
      classes: getStreakClasses(file),
      dataAttributes: getNoteTags(file),
      dots,
    };
  },

  // LIAM you are too tired to do it now, but you can just memoize the expensive
  // functions instead of getDailyMetdata.
  // So in this case, just memoize getDotsForDailyNote. Then you don't need to do
  // any merging...
  getWeeklyMetadata: async (date: Moment): Promise<IWeekMetadata> => {
    const file = getWeeklyNote(date, get(settings));
    const dots = await getDotsForDailyNote(file);

    return {
      classes: getStreakClasses(file),
      dataAttributes: getNoteTags(file),
      dots,
    };
  },

  // Cache keys for perf
  getDailyCacheKey: (cacheArgs: any[], callArgs: any[]): boolean => {
    const cacheDate = cacheArgs[0];
    const callDate = callArgs[0];

    if (callDate !== cacheDate) {
      return false;
    }

    const callFile = getDailyNote(callDate, get(dailyNotes));
    const cacheFile = getDailyNote(cacheDate, get(dailyNotes));
    return callFile?.stat.mtime === cacheFile?.stat.mtime;
  },
  getWeeklyCacheKey: (cacheArgs: any[], callArgs: any[]): boolean => {
    const cacheDate = cacheArgs[0] as Moment;
    const callDate = callArgs[0] as Moment;

    if (!callDate.isSame(cacheDate)) {
      return false;
    }

    const callFile = getDailyNote(callDate, get(dailyNotes));
    const cacheFile = getDailyNote(cacheDate, get(dailyNotes));

    console.log(callFile, cacheFile);
    return (
      callFile?.basename === cacheFile?.basename &&
      callFile?.stat.mtime === cacheFile?.stat.mtime
    );
  },
};
