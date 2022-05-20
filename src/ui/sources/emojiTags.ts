import type { Moment } from "moment";
import { App, parseFrontMatterTags, TFile } from "obsidian";
import CalendarPlugin from "src/main";

import type { Granularity, ICalendarSource, IEvaluatedMetadata } from "../types";

function getNoteTags(note: TFile | null): string[] {
  if (!note) {
    return [];
  }

  const allTags = [];

  const { metadataCache } = window.app;

  const { frontmatter, tags } = metadataCache.getFileCache(note) || {};
  if (frontmatter) {
    const frontmatterTags = parseFrontMatterTags(frontmatter) || [];
    allTags.push(...frontmatterTags);
  }
  if (tags) {
    const nonfrontmatterTags = tags.map((tagCache) => tagCache.tag);
    allTags.push(...nonfrontmatterTags);
  }

  // strip the '#' at the beginning
  return allTags.map((tag) => tag.substring(1));
}

function getEmojiTag(note: TFile | null): string {
  const tags = getNoteTags(note);

  const emojiTags = tags
    .map((tag) => tag.replace(/[^\p{Emoji}]/gu, ""))
    .filter((t) => t)
    .map((emojiTag) => [...emojiTag].pop() ?? "");

  return emojiTags[0];
}

export class EmojiTagsSource implements ICalendarSource {
  public id: string = "emoji";
  public name: string = "Emoji Tags";
  public description: string = "Render emoji tags on your calendar";

  constructor(readonly app: App, readonly plugin: CalendarPlugin) {}

  public defaultSettings = Object.freeze({
    color: "var(--text-muted)",
    enabled: false,
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
      value.attrs = { "data-emoji-tag": getEmojiTag(exactMatch) };
    }
    return value;
  }
}
