import type { Moment } from "moment";

export interface IDot {
  isFilled: boolean;
}

export interface IWeek {
  days: Moment[];
  weekNum: number;
}

export type IMonth = IWeek[];

export type HTMLAttributes = Record<string, string | number | boolean>;

export interface IEvaluatedMetadata {
  value: number | string;
  dots: IDot[];
  attrs?: HTMLAttributes;
}

export interface SourceMetadata extends IEvaluatedMetadata {
  sourceId: string;
}

export type ISourceDisplayOption = "calendar-and-menu" | "menu" | "none";

export interface ISourceSettings {
  color: string;
  enabled: boolean;
  order: number;
}

export interface ICalendarSource {
  id: string;
  name: string;
  description?: string;

  getMetadata: (granularity: Granularity, date: Moment) => Promise<IEvaluatedMetadata>;

  defaultSettings: Record<string, string | number | boolean>;
  registerSettings?: (
    containerEl: HTMLElement,
    settings: ISourceSettings,
    saveSettings: (settings: Partial<ISourceSettings>) => void
  ) => void;
}

export type Granularity =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"; /*| "fiscal-year" */

export interface CalendarEventHandlers {
  onHover?: (periodicity: Granularity, date: Moment, event: PointerEvent) => boolean;
  onClick?: (granularity: Granularity, date: Moment, event: MouseEvent) => boolean;
  onContextMenu?: (granularity: Granularity, date: Moment, event: MouseEvent) => boolean;
}
