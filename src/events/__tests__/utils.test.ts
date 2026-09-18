import { sortEvents, formatTimeUntil, getTimeUntil } from "../utils";
import type { CalendarEvent } from "../types";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "1",
    date: "2026-09-03",
    title: "Teste",
    time: "10:00",
    timezone: "system-default",
    color: "#ff0000",
    remindBeforeMinutes: 15,
    repeat: "none",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as CalendarEvent;
}

describe("formatTimeUntil", () => {
  it("retorna 'agora' para <1min", () => {
    expect(formatTimeUntil(30 * 1000)).toBe("agora");
  });
  it("retorna em X min", () => {
    expect(formatTimeUntil(5 * 60 * 1000)).toBe("em 5 min");
  });
  it("retorna em horas", () => {
    expect(formatTimeUntil(90 * 60 * 1000)).toBe("em 1h 30min");
  });
  it("retorna há X para passado", () => {
    expect(formatTimeUntil(-10 * 60 * 1000)).toBe("há 10 min");
  });
});

describe("sortEvents", () => {
  it("ordena por nome A-Z", () => {
    const a = makeEvent({ id: "a", title: "Zebra" });
    const b = makeEvent({ id: "b", title: "Abacaxi" });
    const sorted = sortEvents([a, b], "name");
    expect(sorted[0].title).toBe("Abacaxi");
  });

  it("ordena por timeUntil futuros primeiro", () => {
    const now = new Date("2026-09-03T09:00:00");
    const early = makeEvent({ id: "1", title: "Early", time: "09:30" });
    const late = makeEvent({ id: "2", title: "Late", time: "10:30" });
    const sorted = sortEvents([late, early], "timeUntil", now);
    expect(sorted[0].id).toBe("1");
  });

  it("passados vão para final", () => {
    const now = new Date("2026-09-03T11:00:00");
    const past = makeEvent({ id: "1", title: "Past", time: "09:00" });
    const future = makeEvent({ id: "2", title: "Future", time: "12:00" });
    const sorted = sortEvents([past, future], "timeUntil", now);
    expect(sorted[0].id).toBe("2");
    expect(sorted[1].id).toBe("1");
  });
});

describe("getTimeUntil", () => {
  it("calcula ms até evento", () => {
    const now = new Date("2026-09-03T09:00:00");
    const ev = makeEvent({ date: "2026-09-03", time: "10:00" });
    const ms = getTimeUntil(ev, now);
    expect(ms).toBe(60 * 60 * 1000);
  });
});
