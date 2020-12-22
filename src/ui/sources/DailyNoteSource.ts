import type { Moment } from "moment";
import { parseFrontMatterTags, TFile } from "obsidian";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { clamp, getWordCount } from "src/ui/utils";

import {
  CalendarSource,
  IDayMetadata,
  IWeekMetadata,
  IDot,
} from "./CalendarSource";
import { activeFile, dailyNotes, settings } from "../stores";

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

export default class DailyNoteSource extends CalendarSource {
  constructor() {
    super();
    dailyNotes.reindex();
  }

  private isActive(file: TFile): boolean {
    const currentActiveFile = get(activeFile);
    return currentActiveFile && currentActiveFile == file;
  }

  private getClasses(file: TFile): string[] {
    const classes = [];
    if (file) {
      classes.push("has-note");
    }
    if (this.isActive(file)) {
      classes.push("active");
    }
    return classes;
  }

  public getDailyMetadata(date: Moment): IDayMetadata {
    const file = getDailyNote(date, get(dailyNotes));
    return {
      classes: this.getClasses(file),
      dataAttributes: getNoteTags(file),
      dots: getDotsForDailyNote(file),
    };
  }

  public getWeeklyMetadata(date: Moment): IWeekMetadata {
    const file = getDailyNote(date, get(dailyNotes));
    return {
      classes: this.getClasses(file),
      dataAttributes: getNoteTags(file),
      dots: getDotsForDailyNote(file),
    };
  }
}
