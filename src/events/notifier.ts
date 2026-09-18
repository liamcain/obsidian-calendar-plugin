import { get } from "svelte/store";
import { eventsStore } from "./store";
import { settings } from "src/ui/stores";
import { getEventDateTime } from "./utils";
import { showCalendarToast } from "src/ui/toast";
import { sendEmailReminder } from "src/integrations/email";
import { snoozeEvent, isSnoozed, SNOOZE_MS } from "./snooze";

const CHECK_INTERVAL_MS = 60 * 1000; // 1 min
const notified = new Map<string, number>(); // id -> timestamp do disparo

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function shouldNotify(eventId: string, fireAt: number): boolean {
  const last = notified.get(eventId);
  if (last && Date.now() - last < 55 * 1000) return false;
  // já notificou e ainda dentro de snooze? deixa passar apenas se snoozed
  if (last && last > fireAt) return false;
  return true;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function checkOnce() {
  const $settings = get(settings);
  if (!$settings.enableEventNotifications) return;

  const record = get(eventsStore);
  const now = Date.now();

  for (const list of Object.values(record)) {
    for (const ev of list) {
      if (isSnoozed(ev.id)) continue;
      const eventTime = getEventDateTime(ev).getTime();
      const remindAt = eventTime - ev.remindBeforeMinutes * 60 * 1000;
      // janela: se now está entre remindAt e eventTime+60s, ou se remindBefore=0 e now ~ eventTime
      const isInWindow = now >= remindAt && now < eventTime + 60 * 1000;
      // também cobre caso usuário abriu app depois do remindAt mas antes do evento
      const isUpcomingSoon = remindAt - now > 0 && remindAt - now < CHECK_INTERVAL_MS;

      if (!isInWindow && !isUpcomingSoon) continue;

      const key = ev.id;
      if (!shouldNotify(key, remindAt)) continue;

      // Evita spam de eventos passados há muito tempo ( >1 min após evento)
      if (now > eventTime + 90 * 1000 && now - eventTime > 5 * 60 * 1000) continue;

      // dispara
      const timeLabel = ev.time;
      const msgParts: string[] = [];
      if (ev.description) msgParts.push(ev.description);
      if (ev.location) msgParts.push(`📍 ${ev.location}`);
      msgParts.push(`⏰ ${timeLabel} (${ev.timezone})`);

      showCalendarToast({
        title: ev.title,
        message: msgParts.join(" • "),
        color: ev.color,
        durationMs: 10000,
        onSnooze: () => {
          snoozeEvent(key, SNOOZE_MS);
          // também bloqueia notificação imediata
          notified.set(key, Date.now() + SNOOZE_MS - CHECK_INTERVAL_MS);
        },
      });
      // se está adiado, não registra como notificado para permitir re-disparo pós-snooze
      if (!isSnoozed(key)) {
        notified.set(key, Date.now());
      }

      // Email opcional (fire-and-forget)
      if (ev.emailReminder && $settings.emailEnabled && $settings.emailWebhookUrl) {
        void sendEmailReminder(ev, {
          enabled: true,
          serviceUrl: $settings.emailWebhookUrl,
        });
      }
    }
  }
}

export function startNotifier(): () => void {
  // check imediato (delay 2s para app carregar)
  const initial = window.setTimeout(checkOnce, 2000);
  const interval = window.setInterval(checkOnce, CHECK_INTERVAL_MS);

  return () => {
    clearTimeout(initial);
    clearInterval(interval);
  };
}

// exposto para testes
export const _test = { checkOnce, notified };
