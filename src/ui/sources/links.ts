import type { Moment } from "moment";
import { App, TFile } from "obsidian";
import type {
  Granularity,
  ICalendarSource,
  IEvaluatedMetadata,
} from "obsidian-calendar-ui";

import CalendarPlugin from "src/main";

import { filledDots } from "./utils";

export function getNumLinks(app: App, note: TFile): number {
  return app.metadataCache.getCache(note.path)?.links?.length || 0;
}

export class LinksSource implements ICalendarSource {
  public id: string = "links";
  public name: string = "Links";
  public description = "Show how many wiki-links this periodic note has";

  constructor(readonly app: App, readonly plugin: CalendarPlugin) {}

  public async getMetadata(
    granularity: Granularity,
    date: Moment
  ): Promise<IEvaluatedMetadata> {
    const file = app.plugins
      .getPlugin("periodic-notes")
      .getPeriodicNote(granularity, date);

    const numBacklinks = file ? getNumLinks(this.app, file) : 0;

    return {
      dots: filledDots(numBacklinks),
      value: numBacklinks,
    };
  }

  defaultSettings = Object.freeze({
    color: "var(--text-faint)",
    enabled: false,
  });
}
