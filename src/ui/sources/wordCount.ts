import type { Moment } from "moment";
import { App, Setting, TFile } from "obsidian";
import type {
  ISourceSettings,
  ICalendarSource,
  IEvaluatedMetadata,
  Granularity,
} from "obsidian-calendar-ui";
import { get } from "svelte/store";

import CalendarPlugin from "src/main";

import { getWordCount } from "../utils";
import { emptyDot, filledDot, filledDots } from "./utils";

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

export class WordCountSource implements ICalendarSource {
  public id: string = "wordCount";
  public name: string = "Words";
  public description: string = "Visualize the word count of your daily note.";

  constructor(readonly app: App, readonly plugin: CalendarPlugin) {}

  public defaultSettings = Object.freeze({
    color: "#ebcb8b",
    display: "calendar-and-menu",
    wordsPerDot: 250,
  });

  async getMetadata(granularity: Granularity, date: Moment): Promise<IEvaluatedMetadata> {
    const periodicNotes = this.app.plugins.getPlugin("periodic-notes");
    const exactMatch = periodicNotes.getPeriodicNote(granularity, date);
    const value: IEvaluatedMetadata = {
      dots: [],
      value: 0,
    };
    if (exactMatch) {
      const wordsPerDot = get(this.plugin.settings).sourceSettings["wordCount"]
        ?.wordsPerDot;
      const wordCount = await getFileWordCount(exactMatch);
      const numDots = Math.floor(wordCount / wordsPerDot);
      if (numDots > 0) {
        value.dots.push(...filledDots(numDots));
      } else {
        value.dots.push(filledDot());
      }
    }
    return value;
  }
  public registerSettings(
    containerEl: HTMLElement,
    sourceSettings: IWordCountSettings,
    saveSettings: (settings: Partial<IWordCountSettings>) => void
  ) {
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
  }
}
