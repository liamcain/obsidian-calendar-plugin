/**
 * Google Calendar integration
 * - Offline: exporta .ics
 * - Online: OAuth2 + Google Calendar API v3 (fetch)
 * Docs: https://developers.google.com/calendar/api/v3/reference/events/insert
 */

import type { CalendarEvent } from "src/events/types";

export function eventToICS(ev: CalendarEvent): string {
  const dt = `${ev.date.replace(/-/g, "")}T${ev.time.replace(":", "")}00`;
  const uid = `${ev.id}@obsidian-calendar`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Obsidian Calendar Plugin//Agenda//PT",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${dt}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    `DESCRIPTION:${escapeICS(ev.description || "")}`,
    ev.location ? `LOCATION:${escapeICS(ev.location)}` : "",
    `COLOR:${ev.color}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function escapeICS(s: string): string {
  // Sanitiza quebra de linha para evitar injeção de linhas ICS (ex: título com "\r\nDTSTART:...")
  return s
    .replace(/\r\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/[,;\\]/g, "\\$&")
    .replace(/\n/g, "\\n");
}

export function downloadICS(ev: CalendarEvent): void {
  const ics = eventToICS(ev);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTitle = ev.title.replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 60).trim() || "evento";
  a.download = `${ev.date}-${safeTitle}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- OAuth & API ----------

const GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Gera URL de autorização OAuth2.
 * redirect_uri = urn:ietf:wg:oauth:2.0:oob (copy-paste) para fluxo manual desktop.
 * Usuário deve criar OAuth client ID tipo "Desktop app" no GCP.
 */
export function buildGoogleAuthUrl(clientId: string, state = "obsidian-calendar"): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

/**
 * Abre browser para autorização e instrui usuário a colar token/código.
 * Como Obsidian não tem servidor de redirect, o fluxo é manual:
 * 1) abre buildGoogleAuthUrl
 * 2) usuário autoriza e copia "code" exibido
 * 3) deve trocar code por access_token via POST (pode exigir client_secret) OU usar implicit token flow se configurado.
 * Para simplificar MVP, aceitamos colar diretamente o access_token obtido via OAuth Playground.
 */
export function openGoogleAuth(clientId: string): void {
  const url = buildGoogleAuthUrl(clientId);
  window.open(url, "_blank");
}

// Converte evento local para payload Google
function toGooglePayload(ev: CalendarEvent) {
  // end = start + 60min (sem duração configurável ainda)
  const startDateTime = `${ev.date}T${ev.time}:00`;
  const startMoment = window.moment(startDateTime, "YYYY-MM-DDTHH:mm:ss");
  const endMoment = startMoment.clone().add(60, "minutes");

  const timeZone = ev.timezone === "system-default" ? undefined : ev.timezone;

  const payload: Record<string, unknown> = {
    summary: ev.title,
    description: ev.description || "",
    location: ev.location || undefined,
    attendees: (ev.attendees || []).map((email) => ({ email })),
    colorId: undefined, // mapeamento hex -> colorId Google opcional
    start: {
      dateTime: startMoment.format(),
      timeZone,
    },
    end: {
      dateTime: endMoment.format(),
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: ev.remindBeforeMinutes > 0 ? [{ method: "popup", minutes: ev.remindBeforeMinutes }] : [],
    },
  };
  return payload;
}

export interface GoogleSyncResult {
  ok: boolean;
  googleEventId?: string;
  error?: string;
}

/**
 * Cria ou atualiza evento no Google Calendar via API.
 * @param ev evento local
 * @param accessToken token OAuth2 válido
 * @param calendarId id do calendário (default "primary")
 */
export async function syncEventToGoogle(
  ev: CalendarEvent,
  accessToken: string,
  calendarId = "primary"
): Promise<GoogleSyncResult> {
  if (!accessToken) return { ok: false, error: "Token não configurado" };

  const payload = toGooglePayload(ev);
  const isUpdate = !!ev.googleEventId;
  const googleId = ev.googleEventId as string;
  const url = isUpdate
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleId)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const method = isUpdate ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message || res.statusText;
      return { ok: false, error: msg };
    }
    const id = (data as { id?: string }).id;
    return { ok: true, googleEventId: id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Valida token via tokeninfo (opcional).
 */
export async function validateGoogleToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    return res.ok;
  } catch {
    return false;
  }
}
