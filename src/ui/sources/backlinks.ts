import type { Moment } from "moment";
import { App, TFile } from "obsidian";
import type {
  Granularity,
  ICalendarSource,
  IEvaluatedMetadata,
} from "obsidian-calendar-ui";

import CalendarPlugin from "src/main";

import { filledDots } from "./utils";

export function getNumBacklinks(app: App, note: TFile): number {
  return Object.values(app.metadataCache.resolvedLinks).reduce(
    (acc, links) => acc + (links[note.path] || 0),
    0
  );
}

export class BackLinksSource implements ICalendarSource {
  public id: string = "backlinks";
  public name: string = "Backlinks";
  public description = "Show how many notes link back to this periodic note";

  constructor(readonly app: App, readonly plugin: CalendarPlugin) {}

  public async getMetadata(
    granularity: Granularity,
    date: Moment
  ): Promise<IEvaluatedMetadata> {
    const file = app.plugins
      .getPlugin("periodic-notes")
      .getPeriodicNote(granularity, date);

    const numBacklinks = file ? getNumBacklinks(this.app, file) : 0;

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
