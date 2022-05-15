import type { Moment } from "moment";
import { App } from "obsidian";
import type {
  Granularity,
  ICalendarSource,
  IEvaluatedMetadata,
} from "obsidian-calendar-ui";

import CalendarPlugin from "src/main";

import { filledDots } from "./utils";

export class RelatedFilesSource implements ICalendarSource {
  public id = "relatedFiles";
  public name = "Related";
  public description =
    "Show how many notes use a Zettelkasten prefix matching the current day";

  constructor(readonly app: App, readonly plugin: CalendarPlugin) {}

  public async getMetadata(
    granularity: Granularity,
    date: Moment
  ): Promise<IEvaluatedMetadata> {
    const relatedFiles = app.plugins
      .getPlugin("periodic-notes")
      .getPeriodicNotes(granularity, date, false)
      .filter((meta) => meta.matchData.exact === false);

    return {
      dots: filledDots(relatedFiles.length),
      value: relatedFiles.length,
    };
  }

  defaultSettings = Object.freeze({
    color: "#b48ead",
    display: "calendar-and-menu",
  });
}
