import { writable, derived, get } from "svelte/store";
import type { CalendarEvent, EventsRecord } from "./types";
import { generateId } from "./utils";

function createEventsStore() {
  const store = writable<EventsRecord>({});

  return {
    ...store,
    setEvents: (record: EventsRecord) => store.set(record || {}),

    getEventsForDate: (dateStr: string): CalendarEvent[] => {
      const rec = get(store);
      return rec[dateStr] ? [...rec[dateStr]] : [];
    },

    addEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): CalendarEvent => {
      const newEvent: CalendarEvent = {
        ...event,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      store.update((rec) => {
        const copy = { ...rec };
        const list = copy[newEvent.date] ? [...copy[newEvent.date]] : [];
        list.push(newEvent);
        copy[newEvent.date] = list;
        return copy;
      });
      return newEvent;
    },

    updateEvent: (updated: CalendarEvent) => {
      store.update((rec) => {
        const copy: EventsRecord = { ...rec };
        // Remove de qualquer data antiga (caso tenha mudado a data)
        for (const key of Object.keys(copy)) {
          copy[key] = copy[key].filter((e) => e.id !== updated.id);
          if (copy[key].length === 0) delete copy[key];
        }
        const list = copy[updated.date] ? [...copy[updated.date]] : [];
        list.push({ ...updated, updatedAt: Date.now() });
        copy[updated.date] = list;
        return copy;
      });
    },

    deleteEvent: (id: string, dateStr: string) => {
      store.update((rec) => {
        const copy = { ...rec };
        if (!copy[dateStr]) return copy;
        copy[dateStr] = copy[dateStr].filter((e) => e.id !== id);
        if (copy[dateStr].length === 0) delete copy[dateStr];
        return copy;
      });
    },

    moveEvent: (id: string, fromDate: string, toDate: string) => {
      if (fromDate === toDate) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) return;
      store.update((rec) => {
        const copy: EventsRecord = { ...rec };
        const srcList = [...(copy[fromDate] || [])];
        const idx = srcList.findIndex((e) => e.id === id);
        if (idx === -1) return copy;
        const [ev] = srcList.splice(idx, 1);
        if (srcList.length === 0) delete copy[fromDate];
        else copy[fromDate] = srcList;
        const moved: CalendarEvent = { ...ev, date: toDate, updatedAt: Date.now() };
        const dest = copy[toDate] ? [...copy[toDate]] : [];
        dest.push(moved);
        copy[toDate] = dest;
        return copy;
      });
    },

    clearAll: () => store.set({}),
  };
}

export const eventsStore = createEventsStore();

// Store para persistência - serializa para ISettings
export function serializeEvents(record: EventsRecord): EventsRecord {
  return record;
}

export function deserializeEvents(data: unknown): EventsRecord {
  if (!data || typeof data !== "object") return {};
  return data as EventsRecord;
}

// Derived helper para contar eventos por dia (para dots)
export const eventsCountByDate = derived(eventsStore, ($rec) => {
  const map: Record<string, number> = {};
  for (const [k, v] of Object.entries($rec)) map[k] = v.length;
  return map;
});
