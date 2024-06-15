import type moment from "moment";
import type { App } from "obsidian";

import Calendar from "./components/Calendar.svelte";
import type { ICalendarSource, IDot, IDayMetadata } from "./types";

declare global {
  interface Window {
    app: App;
    moment: typeof moment;
  }
}

export { Calendar };
export type { ICalendarSource, IDot, IDayMetadata };
export { configureGlobalMomentLocale } from "./localization";
