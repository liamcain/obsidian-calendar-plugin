import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { get } from "svelte/store";

import { eventsStore } from "src/events/store";

export const eventsSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const key = date.format("YYYY-MM-DD");
    const record = get(eventsStore);
    const events = record[key] || [];

    if (events.length === 0) {
      return { dots: [], classes: [] };
    }

    // Cria um dot por evento até 5, agrupando extras
    const dots = events.slice(0, 5).map((ev) => ({
      className: ev.googleEventId ? "event-dot google-dot" : "event-dot",
      color: ev.googleEventId ? "#4285F4" : ev.color || "default",
      isFilled: true,
    }));

    // Se mais de 5, adiciona indicador
    if (events.length > 5) {
      dots[4].className += " has-more";
    }

    return {
      dots,
      classes: ["has-events"],
    };
  },

  getWeeklyMetadata: async (_date: Moment): Promise<IDayMetadata> => {
    return { dots: [], classes: [] };
  },
};
