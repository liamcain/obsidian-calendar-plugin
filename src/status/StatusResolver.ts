/**
 * StatusResolver — reads daily note frontmatter and resolves to a structured status object.
 * Priority: explicit `status` field > tags array > holiday.json (leaveDaySource).
 */

import type { Moment } from "moment";
import type { App, TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";
import { AliasResolver } from "./AliasResolver";
import { StatusConfigStore } from "./StatusConfigStore";
import { wmoToWeather, WMO_WEATHER_MAP, type IStatusPreset, type ICustomStatus, type IMoodPreset, type IWeatherMapping } from "./presets";
import { settings } from "../ui/stores";
import type { ISettings } from "../settings";

export interface IResolvedDayStatus {
  status: {
    id: string;
    label: string;
    emoji: string;
    color: string;
    category: string;
    source: "frontmatter-status" | "frontmatter-tags" | "holiday-json";
  } | null;

  secondaryStatuses: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
  }>;

  moods: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
  }>;

  weather: {
    id: string;
    label: string;
    emoji: string;
    wmoCode: number;
    temperature: number;
  } | null;

  customFields: Record<string, any>;
  remainingTags: string[];
}

export class StatusResolver {
  private app: App;
  private aliasResolver: AliasResolver;
  private configStore: StatusConfigStore;
  private cache = new Map<string, IResolvedDayStatus>();

  constructor(app: App, configStore: StatusConfigStore) {
    this.app = app;
    this.configStore = configStore;
    this.aliasResolver = new AliasResolver(
      configStore.getUserAliases(),
      configStore.getUserMoodAliases()
    );
  }

  /** Invalidate cache for a specific date or all */
  invalidateCache(dateKey?: string): void {
    if (dateKey) {
      this.cache.delete(dateKey);
    } else {
      this.cache.clear();
    }
  }

  /** Resolve the status for a given date — never throws, returns empty result on error.
   * When includeWeather is false, weather is omitted from the result,
   * allowing the caller to supply live weather data separately.
   */
  resolve(date: Moment, includeWeather: boolean = true): IResolvedDayStatus {
    try {
      const dateKey = date.format("YYYY-MM-DD");

      // Cache key includes includeWeather flag so that weatherless lookups
      // don't poison the cache for lookups that want weather.
      const cacheKey = includeWeather ? dateKey : `${dateKey}::no-wx`;
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

      const result = this.resolveFromFrontmatter(date, includeWeather);
      this.cache.set(cacheKey, result);
      return result;
    } catch (e) {
      console.warn("[Calendar+] StatusResolver.resolve failed:", e);
      return this.emptyResult();
    }
  }

  private resolveFromFrontmatter(date: Moment, includeWeather: boolean = true): IResolvedDayStatus {
    const allNotes = getAllDailyNotes();
    const file = getDailyNote(date, allNotes) as TFile | null;

    if (!file) {
      return this.emptyResult();
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm) return this.emptyResult();

    const currentSettings = get(settings) as ISettings;
    const enableStatusTags = currentSettings?.enableStatusTags !== false;
    const enableMoodTracking = currentSettings?.enableMoodTracking !== false;
    const moodFieldName = currentSettings?.moodFieldName || "mood";

    // 1. Parse explicit `status` field (only if status tags enabled)
    let primaryStatus: IResolvedDayStatus["status"] = null;
    const secondaryStatuses: IResolvedDayStatus["secondaryStatuses"] = [];

    const remainingTags: string[] = [];

    if (enableStatusTags) {
      const statusField = fm.status;
      if (statusField) {
        const statusIds = Array.isArray(statusField) ? statusField : [String(statusField)];
        for (const s of statusIds) {
          const id = this.aliasResolver.resolveStatus(String(s));
          if (id) {
            const status = this.configStore.getStatusById(id);
            if (status && !primaryStatus) {
              primaryStatus = {
                id: status.id,
                label: status.label.zh,
                emoji: status.emoji,
                color: status.color,
                category: status.category,
                source: "frontmatter-status",
              };
            } else if (status) {
              secondaryStatuses.push({
                id: status.id,
                label: status.label.zh,
                emoji: status.emoji,
                color: status.color,
              });
            }
          }
        }
      }

      // 2. Parse `tags` array for status tags
      const tags = fm.tags;
      const tagArray = tags ? (Array.isArray(tags) ? tags : String(tags).split(/[,]\s*/)) : [];

      for (const tag of tagArray) {
        const tagStr = String(tag).trim();
        if (!tagStr) continue;
        const id = this.aliasResolver.resolveStatus(tagStr);
        if (id) {
          const status = this.configStore.getStatusById(id);
          if (status) {
            if (!primaryStatus) {
              primaryStatus = {
                id: status.id,
                label: status.label.zh,
                emoji: status.emoji,
                color: status.color,
                category: status.category,
                source: "frontmatter-tags",
              };
            } else {
              secondaryStatuses.push({
                id: status.id,
                label: status.label.zh,
                emoji: status.emoji,
                color: status.color,
              });
            }
          }
        } else {
          remainingTags.push(tagStr);
        }
      }
    } else {
      // Status tags disabled — still collect remaining tags
      const tags = fm.tags;
      const tagArray = tags ? (Array.isArray(tags) ? tags : String(tags).split(/[,]\s*/)) : [];
      for (const tag of tagArray) {
        const tagStr = String(tag).trim();
        if (tagStr) remainingTags.push(tagStr);
      }
    }

    // 3. Parse mood (only if mood tracking enabled)
    const moods: IResolvedDayStatus["moods"] = [];
    if (enableMoodTracking) {
      const moodField = fm[moodFieldName];
      if (moodField) {
        const moodIds = Array.isArray(moodField) ? moodField : [String(moodField)];
        for (const m of moodIds) {
          const id = this.aliasResolver.resolveMood(String(m));
          if (id) {
            const mood = this.configStore.getMoodById(id);
            if (mood) {
              moods.push({
                id: mood.id,
                label: mood.label.zh,
                emoji: mood.emoji,
                color: mood.color,
              });
            }
          }
        }
      }
    }

    // 4. Parse weather (from frontmatter — auto-written by WeatherStore)
    let weather: IResolvedDayStatus["weather"] = null;
    if (includeWeather) {
      const weatherId = (fm.weather as string | undefined) || undefined;  // null/"" → undefined
      const weatherName = (fm.weather_name as string | undefined) || undefined;
      const temperature = fm.temperature as number | undefined;
      const wmoCode = fm.weather_wmo as number | undefined;

      if (weatherId || wmoCode !== undefined) {
        let mapping: IWeatherMapping | null = null;
        // weather id takes priority over wmoCode — user-edited `weather` field
        // is the authoritative value. weather_wmo is only a fallback.
        if (weatherId) {
          mapping = WMO_WEATHER_MAP.find((w: IWeatherMapping) => w.id === weatherId) || null;
        }
        if (!mapping && wmoCode !== undefined) {
          mapping = wmoToWeather(Number(wmoCode));
        }
        if (mapping) {
          weather = {
            id: mapping.id,
            label: mapping.labelZh,
            emoji: mapping.emoji,
            wmoCode: wmoCode !== undefined ? Number(wmoCode) : (mapping.wmoCodes[0] || 0),
            temperature: temperature !== undefined ? Number(temperature) : 0,
          };
        } else if (weatherName) {
          weather = {
            id: weatherId || "unknown",
            label: String(weatherName),
            emoji: "🌡️",
            wmoCode: wmoCode !== undefined ? Number(wmoCode) : 0,
            temperature: temperature !== undefined ? Number(temperature) : 0,
          };
        }
      }
    } // end if (includeWeather)

    // 5. Collect custom fields (exclude known fields)
    const knownKeys = new Set(["date", "tags", "status", moodFieldName, "weather", "weather_name", "temperature", "weather_wmo", "cssclasses", "position"]);
    const customFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(fm)) {
      if (!knownKeys.has(key) && !key.startsWith("_")) {
        customFields[key] = value;
      }
    }

    return {
      status: primaryStatus,
      secondaryStatuses,
      moods,
      weather,
      customFields,
      remainingTags,
    };
  }

  private emptyResult(): IResolvedDayStatus {
    return {
      status: null,
      secondaryStatuses: [],
      moods: [],
      weather: null,
      customFields: {},
      remainingTags: [],
    };
  }
}
