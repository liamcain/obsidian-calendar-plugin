import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import {
  getDailyNote,
  getMonthlyNote,
  getWeeklyNote,
} from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";

import { dailyNotes, monthlyNotes, settings, weeklyNotes } from "../stores";
import { clamp, getWordCount } from "../utils";

const NUM_MAX_DOTS = 5;

export async function getFileWordCount(note: TFile): Promise<number> {
  if (!note) {
    return 0;
  }
  const fileContents = await window.app.vault.cachedRead(note);
  return getWordCount(fileContents);
}

export async function getWordLengthAsDots(note: TFile): Promise<number> {
  const { wordsPerDot = DEFAULT_WORDS_PER_DOT } = get(settings);
  if (!note || wordsPerDot <= 0) {
    return 0;
  }
  const fileContents = await window.app.vault.cachedRead(note);

  const wordCount = getWordCount(fileContents);
  const numDots = wordCount / wordsPerDot;
  return clamp(Math.floor(numDots), 1, NUM_MAX_DOTS);
}

export async function getDotsForDailyNote(
  dailyNote: TFile | null
): Promise<IDot[]> {
  if (!dailyNote) {
    return [];
  }
  const numSolidDots = await getWordLengthAsDots(dailyNote);

  const dots = [];
  for (let i = 0; i < numSolidDots; i++) {
    dots.push({
      color: "default",
      isFilled: true,
    });
  }
  return dots;
}

async function getMetadata(file: TFile): Promise<IDayMetadata> {
  const wordCount = await getFileWordCount(file);

  return {
    color: "#7FA1C0",
    isShowcased: true,
    minDots: 0,
    maxDots: 6,
    name: "Words",
    value: wordCount,
    valueToDotRadio: 1 / 250,
  };
}

export const wordCountSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return getMetadata(file);
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));
    return getMetadata(file);
  },

  getMonthlyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getMonthlyNote(date, get(monthlyNotes));
    return getMetadata(file);
  },
};
