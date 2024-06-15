import type { Locale, Moment } from "moment";
import { SvelteComponentTyped } from "svelte";

export type ILocaleOverride = "system-default" | string;
export type IWeekStartOption =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "locale";

export interface IDot {
  className: string;
  color: string;
  isFilled: boolean;
}

export interface IDayMetadata {
  classes?: string[];
  dataAttributes?: Record<string, string>;
  dots?: IDot[];
}

export interface ICalendarSource {
  getDailyMetadata?: (date: Moment) => Promise<IDayMetadata>;
  getWeeklyMetadata?: (date: Moment) => Promise<IDayMetadata>;
}

export class Calendar extends SvelteComponentTyped<{
  // Settings
  showWeekNums: boolean;
  localeData?: Locale;

  // Event Handlers
  onHoverDay?: (date: Moment, targetEl: EventTarget) => void;
  onHoverWeek?: (date: Moment, targetEl: EventTarget) => void;
  onClickDay?: (date: Moment, isMetaPressed: boolean) => void;
  onClickWeek?: (date: Moment, isMetaPressed: boolean) => void;
  onContextMenuDay?: (date: Moment, event: MouseEvent) => boolean;
  onContextMenuWeek?: (date: Moment, event: MouseEvent) => boolean;

  // External sources
  selectedId?: string | null;
  sources?: ICalendarSource[];

  // Override-able local state
  today?: Moment;
  displayedMonth?: Moment;
}> {}

export function configureGlobalMomentLocale(
  localeOverride: ILocaleOverride,
  weekStart: IWeekStartOption
): string;
