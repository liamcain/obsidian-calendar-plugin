import type { CalendarEvent, SortBy } from "./types";

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Retorna ms até o evento considerando data + time + timezone (simplificado).
 * Para MVP sem moment-timezone, usa local time. Se timezone != system-default,
 * ainda calcula com base no local, mas registra diff para ordenação.
 */
export function getEventDateTime(event: CalendarEvent): Date {
  // event.date = YYYY-MM-DD, event.time = HH:mm
  const iso = `${event.date}T${event.time}:00`;
  const d = new Date(iso);
  // Se timezone for diferente, não convertemos precisamente sem lib, mas mantemos base
  return d;
}

export function getTimeUntil(event: CalendarEvent, now = new Date()): number {
  const eventDate = getEventDateTime(event);
  return eventDate.getTime() - now.getTime();
}

export function formatTimeUntil(ms: number): string {
  if (ms < 0) {
    const abs = Math.abs(ms);
    const mins = Math.floor(abs / 60000);
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `há ${days}d`;
  }
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `em ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) {
    return remMins ? `em ${hrs}h ${remMins}min` : `em ${hrs}h`;
  }
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs ? `em ${days}d ${remHrs}h` : `em ${days}d`;
}

export function sortEvents(events: CalendarEvent[], sortBy: SortBy, now = new Date()): CalendarEvent[] {
  const copy = [...events];
  if (sortBy === "name") {
    return copy.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  }
  // timeUntil => mais próximo primeiro, passados por último
  return copy.sort((a, b) => {
    const aUntil = getTimeUntil(a, now);
    const bUntil = getTimeUntil(b, now);
    // eventos futuros primeiro (menor até positivo), depois passados (negativos no final mas ordenados pelo mais recente)
    const aPast = aUntil < 0;
    const bPast = bUntil < 0;
    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;
    return aUntil - bUntil;
  });
}

export function isEventToday(event: CalendarEvent, todayStr: string): boolean {
  return event.date === todayStr;
}

export function getTodayStr(): string {
  return window.moment().format("YYYY-MM-DD");
}

export function expandRepeatForDate(events: CalendarEvent[], targetDate: string): CalendarEvent[] {
  // Para MVP, apenas retorna eventos com repeat que coincidem com targetDate
  // Lógica simples: se repeat != none e data original < target, verifica intervalo
  const target = window.moment(targetDate, "YYYY-MM-DD");
  const result: CalendarEvent[] = [];
  for (const ev of events) {
    if (ev.date === targetDate) {
      result.push(ev);
      continue;
    }
    if (ev.repeat === "none") continue;
    const origin = window.moment(ev.date, "YYYY-MM-DD");
    if (!target.isAfter(origin)) continue;
    if (ev.repeatUntil && target.isAfter(window.moment(ev.repeatUntil, "YYYY-MM-DD"))) continue;

    const diffDays = target.diff(origin, "days");
    const diffMonths = target.diff(origin, "months");
    const diffYears = target.diff(origin, "years");

    let match = false;
    switch (ev.repeat) {
      case "daily":
        match = true;
        break;
      case "weekly":
        match = diffDays % 7 === 0;
        break;
      case "monthly":
        match = target.date() === origin.date() && diffMonths >= 1;
        break;
      case "yearly":
        match = target.format("MM-DD") === origin.format("MM-DD") && diffYears >= 1;
        break;
    }
    if (match) {
      result.push({ ...ev, date: targetDate, id: `${ev.id}__${targetDate}` });
    }
  }
  return result;
}
