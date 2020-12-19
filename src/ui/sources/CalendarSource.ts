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

export interface IWeekMetadata {
  classes?: string[];
  dataAttributes?: string[];
  dots: Promise<IDot[]>;
}

export abstract class CalendarSource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getDailyMetadata(date: Moment, ...args: any[]): IDayMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getWeeklyMetadata(date: Moment, ...args: any[]): IDayMetadata;
}
