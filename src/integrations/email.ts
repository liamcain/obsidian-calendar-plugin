/**
 * Email reminder — stub para Fase 3
 * Obsidian não envia email nativamente. Opções: webhook, EmailJS, n8n.
 * MVP: apenas log + Notice. Config futura em settings.
 */

import type { CalendarEvent } from "src/events/types";

export interface EmailConfig {
  enabled: boolean;
  serviceUrl?: string; // webhook
  from?: string;
}

export async function sendEmailReminder(ev: CalendarEvent, config: EmailConfig): Promise<boolean> {
  if (!config.enabled || !config.serviceUrl) {
    console.log("[Calendar] Email reminder solicitado mas não configurado", ev);
    return false;
  }
  try {
    const res = await fetch(config.serviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Lembrete: ${ev.title}`,
        text: `${ev.description || ""}\n\n⏰ ${ev.date} ${ev.time} (${ev.timezone})\n📍 ${ev.location || ""}\n👥 ${(ev.attendees || []).join(", ")}`,
        event: ev,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Calendar] Falha ao enviar email", e);
    return false;
  }
}
