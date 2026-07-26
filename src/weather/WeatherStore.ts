/**
 * WeatherStore — fetches weather data from Open-Meteo API and caches it.
 * Caches by date+coordinates to avoid redundant API calls.
 */

import { requestUrl } from "obsidian";
import { wmoToWeather, type IWeatherMapping } from "../status/presets";

export interface IWeatherData {
  id: string;           // canonical id: "sunny", "cloudy", ...
  label: string;        // Chinese label: "晴", "多云", ...
  emoji: string;        // emoji
  wmoCode: number;      // raw WMO code
  temperature: number;  // temperature in °C
  date: string;         // YYYY-MM-DD
  fetchedAt: number;    // epoch ms
}

interface IWeatherCacheEntry extends IWeatherData {
  coords: string; // "lat,lon" rounded
}

interface IForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
  };
}

interface IArchiveResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

const CURRENT_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours for current day
const HISTORICAL_CACHE_TTL = Infinity;         // Historical weather never changes

export class WeatherStore {
  private cache = new Map<string, IWeatherCacheEntry>(); // key: "lat,lon,YYYY-MM-DD"
  private latitude: number = 0;
  private longitude: number = 0;
  private enabled = false;

  setLocation(lat: number, lon: number): void {
    this.latitude = lat;
    this.longitude = lon;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  hasLocation(): boolean {
    return this.latitude !== 0 && this.longitude !== 0;
  }

  private coordsKey(): string {
    return `${this.latitude.toFixed(2)},${this.longitude.toFixed(2)}`;
  }

  private cacheKey(date: string): string {
    return `${this.coordsKey()},${date}`;
  }

  /** Get weather for a specific date. Fetches from API if not cached. */
  async getWeather(date: string): Promise<IWeatherData | null> {
    if (!this.enabled || !this.hasLocation()) return null;

    const key = this.cacheKey(date);
    const cached = this.cache.get(key);

    const today = new Date().toISOString().slice(0, 10);
    const isToday = date === today;
    const isPast = date < today;

    // Check cache validity
    if (cached) {
      if (isPast) return cached; // Historical: cache forever
      if (isToday && Date.now() - cached.fetchedAt < CURRENT_CACHE_TTL) return cached;
    }

    // Fetch from API
    try {
      let data: IWeatherData | null = null;

      if (isToday || date > today) {
        data = await this.fetchCurrent(date);
      } else {
        data = await this.fetchHistorical(date);
      }

      if (data) {
        this.cache.set(key, { ...data, coords: this.coordsKey() });
        return data;
      }
    } catch (e) {
      console.warn("[Calendar+] Weather fetch failed for", date, e);
      // Return cached data even if stale
      if (cached) return cached;
    }

    return null;
  }

  /** Fetch current/forecast weather from Open-Meteo */
  private async fetchCurrent(date: string): Promise<IWeatherData | null> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,weather_code&timezone=Asia/Shanghai`;
    const resp = await requestUrl({ url, method: "GET" });
    if (resp.status !== 200) return null;

    const data = resp.json as IForecastResponse;
    const wmo = data.current.weather_code;
    const mapping = wmoToWeather(wmo);

    return {
      id: mapping?.id || "unknown",
      label: mapping?.labelZh || "未知",
      emoji: mapping?.emoji || "🌡️",
      wmoCode: wmo,
      temperature: Math.round(data.current.temperature_2m * 10) / 10,
      date,
      fetchedAt: Date.now(),
    };
  }

  /** Fetch historical weather from Open-Meteo Archive API */
  private async fetchHistorical(date: string): Promise<IWeatherData | null> {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${this.latitude}&longitude=${this.longitude}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Shanghai`;
    const resp = await requestUrl({ url, method: "GET" });
    if (resp.status !== 200) return null;

    const data = resp.json as IArchiveResponse;
    if (!data.daily || data.daily.time.length === 0) return null;

    const wmo = data.daily.weather_code[0];
    const tempMax = data.daily.temperature_2m_max[0];
    const tempMin = data.daily.temperature_2m_min[0];
    const mapping = wmoToWeather(wmo);
    const avgTemp = Math.round(((tempMax + tempMin) / 2) * 10) / 10;

    return {
      id: mapping?.id || "unknown",
      label: mapping?.labelZh || "未知",
      emoji: mapping?.emoji || "🌡️",
      wmoCode: wmo,
      temperature: avgTemp,
      date,
      fetchedAt: Date.now(),
    };
  }

  /** Clear all cached data */
  clearCache(): void {
    this.cache.clear();
  }
}
