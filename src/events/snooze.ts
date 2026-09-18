import { writable, get } from "svelte/store";

export const SNOOZE_MS = 10 * 60 * 1000;

// id -> timestamp até quando está adiado
const snoozedStore = writable<Record<string, number>>({});

export function snoozeEvent(id: string, ms: number = SNOOZE_MS): void {
  const until = Date.now() + ms;
  snoozedStore.update((m) => ({ ...m, [id]: until }));
}

export function isSnoozed(id: string, nowMs = Date.now()): boolean {
  const m = get(snoozedStore);
  const until = m[id];
  return !!until && until > nowMs;
}

export function getSnoozedUntil(id: string): number | null {
  const m = get(snoozedStore);
  return m[id] ?? null;
}

export function clearExpiredSnoozes(nowMs = Date.now()): void {
  snoozedStore.update((m) => {
    const copy = { ...m };
    let changed = false;
    for (const [k, v] of Object.entries(copy)) {
      if (v <= nowMs) {
        delete copy[k];
        changed = true;
      }
    }
    return changed ? copy : m;
  });
}

export function clearSnooze(id: string): void {
  snoozedStore.update((m) => {
    if (!(id in m)) return m;
    const copy = { ...m };
    delete copy[id];
    return copy;
  });
}

export const snoozed = snoozedStore;
