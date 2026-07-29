/**
 * statusSource — new ICalendarSource that combines:
 * 1. Frontmatter status/tags/mood parsing (via StatusResolver)
 * 2. Holiday/leave/makeup-workday detection (via leaveDaySource as fallback)
 * 3. Weather data display (via WeatherStore — live fetch for today, frontmatter for past days)
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
import { WeatherStore, type IWeatherData } from "../../weather/WeatherStore";

let _statusResolver: StatusResolver | null = null;
let _weatherStore: WeatherStore | null = null;

export function setStatusResolver(resolver: StatusResolver): void {
  _statusResolver = resolver;
}

export function setWeatherStore(store: WeatherStore): void {
  _weatherStore = store;
}

/**
 * Build IDayMetadata from resolved status + fallback.
 * Optionally override weather with live data from WeatherStore.
 */
function buildMetadataFromResolved(
  resolved: IResolvedDayStatus,
  fallback: IDayMetadata,
  liveWeather?: IWeatherData | null
): IDayMetadata {
  const classes: string[] = [];
  const dataAttributes: Record<string, string> = {};

  // --- Status (primary) ---
  if (resolved.status) {
    const id = resolved.status.id;
    if (id === "leave") classes.push("is-leave-day");
    else if (id === "holiday") classes.push("is-holiday");
    else if (id === "non-workday") classes.push("is-nonworkday");
    else if (id === "overtime") classes.push("is-makeup-workday");

    dataAttributes["data-status"] = id;
    dataAttributes["data-status-emoji"] = resolved.status.emoji;
    dataAttributes["data-status-label"] = resolved.status.label;
    dataAttributes["style"] = `--status-color: ${resolved.status.color};`;
    dataAttributes["data-status-color"] = resolved.status.color;
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
  // Priority: liveWeather (from WeatherStore, only when frontmatter has none) > resolved.weather (from frontmatter)
  const weather = liveWeather
    ? {
        id: liveWeather.id,
        label: liveWeather.label,
        emoji: liveWeather.emoji,
        temperature: liveWeather.temperature,
      }
    : resolved.weather;

  if (weather) {
    dataAttributes["data-weather"] = weather.id;
    dataAttributes["data-weather-emoji"] = weather.emoji;
    dataAttributes["data-weather-label"] = weather.label;
    dataAttributes["data-temperature"] = String(weather.temperature);
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

    // Determine if this date is "today" for live weather fetching
    const dateStr = date.format("YYYY-MM-DD");
    const todayStr = window.moment().format("YYYY-MM-DD");
    const isToday = dateStr === todayStr;

    // 1. Try StatusResolver (frontmatter-based)
    //    Always includeWeather=true so frontmatter weather is always read.
    //    This respects user edits to the `weather` frontmatter field.
    //    For today, live WeatherStore data is only used as a fallback
    //    when frontmatter has no weather data (see step 3 below).
    if (_statusResolver) {
      try {
        const resolved = _statusResolver.resolve(date, true);

        if (resolved.status || resolved.moods.length > 0 || resolved.weather) {
          // 2. Also get fallback from leaveDaySource (for holiday/makeup-workday)
          let fallback: IDayMetadata = {};
          try {
            fallback = await leaveDaySource.getDailyMetadata(date);
          } catch (e) {
            console.warn("[Calendar+] leaveDaySource fallback failed:", e);
          }

          // 3. For today's date, if frontmatter has NO weather,
          //    fetch live weather from WeatherStore as a fallback.
          //    If frontmatter already has weather (user-edited or auto-written),
          //    we respect it and do NOT override with API data.
          let liveWeather: IWeatherData | null = null;
          if (isToday && !resolved.weather && _weatherStore && _weatherStore.isEnabled() && _weatherStore.hasLocation()) {
            try {
              liveWeather = await _weatherStore.getWeather(dateStr);
            } catch (e) {
              console.warn("[Calendar+] Live weather fetch failed for", dateStr, e);
            }
          }

          return buildMetadataFromResolved(resolved, fallback, liveWeather);
        } else {
          // No status/mood/weather in frontmatter, but still try live weather for today
          if (isToday && _weatherStore && _weatherStore.isEnabled() && _weatherStore.hasLocation()) {
            try {
              const liveWeather = await _weatherStore.getWeather(dateStr);
              if (liveWeather) {
                // Build metadata with just weather
                let fallback: IDayMetadata = {};
                try {
                  fallback = await leaveDaySource.getDailyMetadata(date);
                } catch (e) {
                  console.warn("[Calendar+] leaveDaySource fallback failed:", e);
                }
                return buildMetadataFromResolved(resolved, fallback, liveWeather);
              }
            } catch (e) {
              console.warn("[Calendar+] Live weather fetch failed for", dateStr, e);
            }
          }
        }
      } catch (e) {
        console.warn("[Calendar+] StatusResolver failed for", dateStr, e);
      }
    }

    // 4. Fallback to leaveDaySource entirely (holiday/leave/makeup-workday)
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
