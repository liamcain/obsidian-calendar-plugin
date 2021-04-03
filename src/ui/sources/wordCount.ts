import type { Moment } from "moment";
import { Setting, TFile } from "obsidian";
import type {
  ISourceSettings,
  ICalendarSource,
  IEvaluatedMetadata,
} from "obsidian-calendar-ui";

import { settings } from "../stores";
import { getWordCount } from "../utils";
import { emptyDot, filledDots } from "./utils";

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

export const wordCountSource: ICalendarSource = {
  id: "wordCount",
  name: "Words",
  description:
    "Visualize the word count of your daily note. Customize the words per dot to help track your daily writing habits.",
  getMetadata: async (
    _date: Moment,
    file: TFile
  ): Promise<IEvaluatedMetadata> => {
    const wordsPerDot = settings.getSourceSettings<IWordCountSettings>(
      "wordCount"
    ).wordsPerDot;
    const wordCount = await getFileWordCount(file);
    const numDots = Math.floor(wordCount / wordsPerDot);

    const dots = filledDots(numDots);
    if (file && !numDots) {
      dots.push(emptyDot());
    }

    return {
      dots,
      value: wordCount,
    };
  },
  defaultSettings: Object.freeze({
    color: "#ebcb8b",
    display: "calendar-and-menu",
    wordsPerDot: 250,
  }),
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
};
