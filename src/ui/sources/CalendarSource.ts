import type { Moment } from "moment";

export interface IDot {
  color: string;
  isFilled: boolean;
}

export interface IDayMetadata {
  classes?: string[];
  dataAttributes?: string[];
  dots: Promise<IDot[]>;
}

export abstract class CalendarSource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getMetadata(date: Moment, ...args: any[]): IDayMetadata;
}
