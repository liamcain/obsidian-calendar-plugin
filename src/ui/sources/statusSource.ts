/**
 * statusSource — new ICalendarSource that combines:
 * 1. Frontmatter status/tags/mood parsing (via StatusResolver)
 * 2. Holiday/leave/makeup-workday detection (via leaveDaySource as fallback)
 * 3. Weather data display (via WeatherStore)
 *
 * Replaces customTagsSource + leaveDaySource with a unified source.
 */

import type { Moment } from "moment";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { get } from "svelte/store";
import type { ISettings } from "../../settings";
import { settings } from "../stores";
import { StatusResolver, type IResolvedDayStatus } from "../../status/StatusResolver";
import { leaveDaySource } from "./leaveDay";
import { WeatherStore } from "../../weather/WeatherStore";

let _statusResolver: StatusResolver | null = null;
let _weatherStore: WeatherStore | null = null;

export function setStatusResolver(resolver: StatusResolver): void {
  _statusResolver = resolver;
}

export function setWeatherStore(store: WeatherStore): void {
  _weatherStore = store;
}

function buildMetadataFromResolved(resolved: IResolvedDayStatus, fallback: IDayMetadata): IDayMetadata {
  const classes: string[] = [];
  const dataAttributes: Record<string, string> = {};

  // --- Status (primary) ---
  if (resolved.status) {
    const id = resolved.status.id;
    // Backward-compatible CSS classes for all known statuses
    if (id === "leave") classes.push("is-leave-day");
    else if (id === "holiday") classes.push("is-holiday");
    else if (id === "non-workday") classes.push("is-nonworkday");
    else if (id === "overtime") classes.push("is-makeup-workday");

    // New data attributes
    dataAttributes["data-status"] = id;
    dataAttributes["data-status-emoji"] = resolved.status.emoji;
    dataAttributes["data-status-label"] = resolved.status.label;
    // Use inline style to set --status-color CSS variable (CSS attr() can't do this)
    dataAttributes["style"] = `--status-color: ${resolved.status.color};`;
    dataAttributes["data-status-color"] = resolved.status.color;
    // Note: do NOT set data-day-marker/data-day-marker-name here —
    // those are only for leaveDaySource fallback (days without status tags).
    // ::after is used by status emoji; day-marker label uses ::after only when no status emoji.
  }

  // --- Secondary statuses ---
  if (resolved.secondaryStatuses.length > 0) {
    dataAttributes["data-secondary-statuses"] = JSON.stringify(
      resolved.secondaryStatuses.map(s => ({ id: s.id, emoji: s.emoji, label: s.label }))
    );
  }

  // --- Mood ---
  if (resolved.moods.length > 0) {
    const first = resolved.moods[0];
    dataAttributes["data-mood"] = first.id;
    dataAttributes["data-mood-emoji"] = first.emoji;
    dataAttributes["data-mood-label"] = first.label;
    if (resolved.moods.length > 1) {
      dataAttributes["data-mood-extra"] = JSON.stringify(
        resolved.moods.slice(1).map(m => m.emoji)
      );
    }
  }

  // --- Weather ---
  if (resolved.weather) {
    dataAttributes["data-weather"] = resolved.weather.id;
    dataAttributes["data-weather-emoji"] = resolved.weather.emoji;
    dataAttributes["data-weather-label"] = resolved.weather.label;
    dataAttributes["data-temperature"] = String(resolved.weather.temperature);
  }

  // --- Remaining tags ---
  if (resolved.remainingTags.length > 0) {
    dataAttributes["data-tags"] = resolved.remainingTags.join(" ");
  }

  // --- Custom fields ---
  const customKeys = Object.keys(resolved.customFields);
  if (customKeys.length > 0) {
    dataAttributes["data-custom"] = JSON.stringify(resolved.customFields);
  }

  // --- Merge fallback (holiday/makeup-workday from leaveDaySource) ---
  // Only merge classes and day-marker attrs that aren't already set by status
  if (fallback.classes) {
    for (const cls of fallback.classes) {
      if (!classes.includes(cls)) classes.push(cls);
    }
  }
  if (fallback.dataAttributes) {
    for (const [key, value] of Object.entries(fallback.dataAttributes)) {
      if (!dataAttributes[key]) dataAttributes[key] = value;
    }
  }

  return { classes, dataAttributes };
}

export const statusSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const currentSettings = get(settings) as ISettings;
    if (!currentSettings?.showDayMarkers) return {};

    // 1. Try StatusResolver (frontmatter-based) — wrapped in try-catch to avoid breaking calendar render
    if (_statusResolver) {
      try {
        const resolved = _statusResolver.resolve(date);

        if (resolved.status || resolved.moods.length > 0 || resolved.weather) {
          // 2. Also get fallback from leaveDaySource (for holiday/makeup-workday)
          let fallback: IDayMetadata = {};
          try {
            fallback = await leaveDaySource.getDailyMetadata(date);
          } catch (e) {
            console.warn("[Calendar+] leaveDaySource fallback failed:", e);
          }
          return buildMetadataFromResolved(resolved, fallback);
        }
      } catch (e) {
        console.warn("[Calendar+] StatusResolver failed for", date.format("YYYY-MM-DD"), e);
      }
    }

    // 3. Fallback to leaveDaySource entirely (holiday/leave/makeup-workday)
    try {
      return await leaveDaySource.getDailyMetadata(date);
    } catch (e) {
      console.warn("[Calendar+] leaveDaySource failed:", e);
      return {};
    }
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    return {};
  },
};
