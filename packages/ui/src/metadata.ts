import type { Moment } from "moment";

import type { ICalendarSource, IDayMetadata } from "./types";

async function metadataReducer(
  promisedMetadata: Promise<IDayMetadata>[]
): Promise<IDayMetadata> {
  const meta = {
    dots: [],
    classes: [],
    dataAttributes: {},
  };
  const metas = await Promise.all(promisedMetadata);
  return metas.reduce(
    (acc, meta) => ({
      classes: [...acc.classes, ...(meta.classes || [])],
      dataAttributes: Object.assign(acc.dataAttributes, meta.dataAttributes),
      dots: [...acc.dots, ...(meta.dots || [])],
    }),
    meta
  );
}

export function getDailyMetadata(
  sources: ICalendarSource[],
  date: Moment,
  ..._args: unknown[]
): Promise<IDayMetadata> {
  return metadataReducer(
    sources.map((source) => source.getDailyMetadata(date))
  );
}

export function getWeeklyMetadata(
  sources: ICalendarSource[],
  date: Moment,
  ..._args: unknown[]
): Promise<IDayMetadata> {
  return metadataReducer(
    sources.map((source) => source.getWeeklyMetadata(date))
  );
}
