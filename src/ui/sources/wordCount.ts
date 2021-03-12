import type { Moment } from "moment";
import { Setting, TFile } from "obsidian";
import type {
  ISourceSettings,
  ICalendarSource,
  IDayMetadata,
} from "obsidian-calendar-ui";
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

interface IWordCountSettings extends ISourceSettings {
  wordsPerDot: number;
}

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

async function getMetadata(file: TFile): Promise<IDayMetadata> {
  const wordCount = await getFileWordCount(file);
  const color = "#7FA1C0";
  const numDots = Math.floor(wordCount / 250);

  return {
    color,
    name: "Words",
    value: wordCount,
    isShowcased: true,
    toDots: () => {
      return [...Array(numDots).keys()].map(() => ({
        color,
        isFilled: true,
      }));
    },
  };
}

export const wordCountSource: ICalendarSource = {
  id: "wordCount",
  name: "Word Count",
  registerSettings: (
    containerEl: HTMLElement,
    sourceSettings: IWordCountSettings,
    saveSettings: (settings: Partial<IWordCountSettings>) => void
  ) => {
    new Setting(containerEl)
      .setName("Words per dot")
      .setDesc("How many words should be represented by a single dot?")
      .addText((textfield) => {
        textfield.inputEl.type = "number";
        textfield.setValue(String(sourceSettings.wordsPerDot));
        textfield.onChange((val) => {
          saveSettings({ wordsPerDot: Number(val) });
        });
      });
  },
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
