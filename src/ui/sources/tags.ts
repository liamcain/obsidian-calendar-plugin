import type { Moment } from "moment";
import { parseFrontMatterTags, TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { getWeeklyNote } from "src/io/weeklyNotes";

import { dailyNotes, settings } from "../stores";

function getNoteTags(note: TFile | null): string[] {
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

export const customTagsSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return {
      dataAttributes: getNoteTags(file),
      dots: [],
    };
  },
  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(settings));
    return {
      dataAttributes: getNoteTags(file),
      dots: [],
    };
  },
};
