export type RepeatRule = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  time: string; // HH:mm
  timezone: string; // ex: America/Sao_Paulo or "system-default"
  color: string; // hex
  location?: string;
  attendees?: string[]; // nomes/emails separados por vírgula
  remindBeforeMinutes: number; // 0,5,15,30,60,1440...
  repeat: RepeatRule;
  repeatUntil?: string; // YYYY-MM-DD
  googleEventId?: string;
  emailReminder?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type EventsRecord = Record<string, CalendarEvent[]>; // key = YYYY-MM-DD

export type SortBy = "name" | "timeUntil";

export const DEFAULT_EVENT_COLOR = "#7a6ea6";

export const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: "none", label: "Não repetir" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "yearly", label: "Anualmente" },
];

export const REMIND_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Na hora" },
  { value: 5, label: "5 min antes" },
  { value: 15, label: "15 min antes" },
  { value: 30, label: "30 min antes" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 dia antes" },
];

export const COMMON_TIMEZONES: string[] = [
  "system-default",
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Recife",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "UTC",
];

export function getSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "system-default";
  } catch {
    return "system-default";
  }
}
