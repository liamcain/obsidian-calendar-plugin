/**
 * WeatherAutoWriter — automatically writes weather data to daily note frontmatter.
 * Triggers on: create daily note, open daily note (without existing weather data).
 */

import type { Moment } from "moment";
import type { App, TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { WeatherStore, type IWeatherData } from "./WeatherStore";

export class WeatherAutoWriter {
  private app: App;
  private weatherStore: WeatherStore;
  private enabled = false;

  constructor(app: App, weatherStore: WeatherStore) {
    this.app = app;
    this.weatherStore = weatherStore;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Auto-write weather to a daily note if:
   * - Weather auto-fetch is enabled
   * - The note doesn't already have weather data
   * - We have a valid location
   */
  async tryWriteWeather(date: Moment): Promise<void> {
    if (!this.enabled || !this.weatherStore.isEnabled() || !this.weatherStore.hasLocation()) return;

    const allNotes = getAllDailyNotes();
    const file = getDailyNote(date, allNotes) as TFile | null;
    if (!file) return;

    // Check if weather data already exists
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (fm?.weather || fm?.weather_wmo !== undefined) return; // Already has weather

    // Fetch weather
    const dateStr = date.format("YYYY-MM-DD");
    const weather = await this.weatherStore.getWeather(dateStr);
    if (!weather) return;

    // Write to frontmatter
    await this.writeWeatherToFile(file, weather);
  }

  /** Write weather data to a file's frontmatter using Obsidian's processFrontMatter API */
  private async writeWeatherToFile(file: TFile, weather: IWeatherData): Promise<void> {
    try {
      // @ts-ignore - processFrontMatter is available but not in stable typings
      await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, any>) => {
        // Only write if not already present (don't overwrite user edits)
        if (frontmatter.weather === undefined) frontmatter.weather = weather.id;
        if (frontmatter.weather_name === undefined) frontmatter.weather_name = weather.label;
        if (frontmatter.temperature === undefined) frontmatter.temperature = weather.temperature;
        if (frontmatter.weather_wmo === undefined) frontmatter.weather_wmo = weather.wmoCode;
      });
    } catch (e) {
      console.warn("[Calendar+] Failed to auto-write weather to", file.path, e);
    }
  }
}
