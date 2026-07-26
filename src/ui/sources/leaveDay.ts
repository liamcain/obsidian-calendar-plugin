import type { Moment } from "moment";
import { App, TFile, Notice, requestUrl } from "obsidian";
import type { ICalendarSource, IDayMetadata } from "obsidian-calendar-ui";
import { getAllDailyNotes, getDailyNote, getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";
import type { ISettings } from "../../settings";
import { settings } from "../stores";

// ===== Types =====

interface IHolidayEntry {
  holiday: boolean;     // true = 节假日(休息), false = 调休补班
  name: string;
  date: string;         // YYYY-MM-DD
  wage: number;
  rest: number;
  after?: boolean;
  target?: string;
}

interface IHolidayApiResponse {
  code: 0;
  holiday: Record<string, IHolidayEntry>;
}

interface IYearCache {
  year: number;
  fetchedAt: number;    // epoch ms
  holidays: Record<string, IHolidayEntry>;  // key: "YYYY-MM-DD" (from timor.tech API)
}

// ===== Cache State =====

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
let _app: App | null = null;
let yearCache = new Map<number, IYearCache>();
let dailyNoteLeaveCache = new Set<string>();  // dateKey "YYYY-MM-DD"
let dailyNoteCacheBuilt = false;
let loadingPromise: Promise<void> | null = null;

// ===== App Instance =====

export function setAppInstance(appInstance: App): void {
  _app = appInstance;
}

function getPluginConfigDir(): string {
  if (!_app) return "";
  // @ts-ignore - internal API
  const manifest = _app.plugins?.manifests?.["calendar"];
  if (manifest && manifest.dir) {
    return manifest.dir;
  }
  // @ts-ignore
  return `${_app.vault.adapter.getBasePath()}/.obsidian/plugins/calendar`;
}

function getCacheFilePath(year: number): string {
  return `${getPluginConfigDir()}/holiday-cache-${year}.json`;
}

// ===== Holiday API =====

async function fetchHolidaysFromAPI(year: number): Promise<Record<string, IHolidayEntry>> {
  const url = `https://timor.tech/api/holiday/year/${year}`;
  const resp = await requestUrl({ url, method: "GET" });
  if (resp.status !== 200) {
    throw new Error(`Holiday API returned status ${resp.status}`);
  }
  const data = resp.json as IHolidayApiResponse;
  if (data.code !== 0 || !data.holiday) {
    throw new Error("Holiday API returned invalid data");
  }
  return data.holiday;
}

async function loadCacheFromFile(year: number): Promise<IYearCache | null> {
  if (!_app) return null;
  const cachePath = getCacheFilePath(year);
  try {
    const content = await _app.vault.adapter.read(cachePath);
    const cache = JSON.parse(content) as IYearCache;
    if (cache && cache.year === year && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return cache;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveCacheToFile(cache: IYearCache): Promise<void> {
  if (!_app) return;
  const cachePath = getCacheFilePath(cache.year);
  try {
    const dir = getPluginConfigDir();
    // Ensure directory exists
    if (!(await _app.vault.adapter.exists(dir))) {
      await _app.vault.adapter.mkdir(dir);
    }
    await _app.vault.adapter.write(cachePath, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.warn("[Calendar+] Failed to save holiday cache:", e);
  }
}

async function ensureYearLoaded(year: number): Promise<void> {
  if (yearCache.has(year)) return;

  // Try file cache first
  const fileCache = await loadCacheFromFile(year);
  if (fileCache) {
    yearCache.set(year, fileCache);
    return;
  }

  // Fetch from API
  try {
    const holidays = await fetchHolidaysFromAPI(year);
    const cache: IYearCache = {
      year,
      fetchedAt: Date.now(),
      holidays,
    };
    yearCache.set(year, cache);
    await saveCacheToFile(cache);
  } catch (e) {
    console.error("[Calendar+] Failed to fetch holidays for", year, e);
    new Notice(`Calendar+ 节假日数据获取失败 (${year})，请检查网络连接`);
  }
}

async function ensureYearsLoaded(years: number[]): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    await Promise.all(years.map((y) => ensureYearLoaded(y)));
  })().finally(() => {
    loadingPromise = null;
  });
  return loadingPromise;
}

function getHolidayForDate(date: Moment): IHolidayEntry | null {
  const year = date.year();
  const cache = yearCache.get(year);
  if (!cache) return null;
  // timor.tech API returns keys in "YYYY-MM-DD" format (e.g. "2025-01-01")
  const dateKey = date.format("YYYY-MM-DD");
  return cache.holidays[dateKey] || null;
}

// ===== Leave Day Detection (from daily note frontmatter tags) =====

function buildDailyNoteLeaveCache(): void {
  if (!_app) return;
  const allNotes = getAllDailyNotes();
  const leaveSet = new Set<string>();

  const currentSettings = get(settings) as ISettings;
  const leaveTag = (currentSettings?.leaveDayTag || "请假").toLowerCase();

  for (const [dateKey, file] of Object.entries(allNotes)) {
    const cache = _app.metadataCache.getFileCache(file as TFile);
    if (!cache || !cache.frontmatter) continue;
    const tags = cache.frontmatter.tags;
    if (!tags) continue;
    const tagArray = Array.isArray(tags) ? tags : String(tags).split(/[,]\s*/);
    const isLeave = tagArray.some((t: string) => t.trim().toLowerCase() === leaveTag);
    if (isLeave) {
      leaveSet.add(dateKey);
    }
  }

  dailyNoteLeaveCache = leaveSet;
  dailyNoteCacheBuilt = true;
}

function isLeaveDay(date: Moment): boolean {
  if (!dailyNoteCacheBuilt) {
    buildDailyNoteLeaveCache();
  }
  const dateKey = date.format("YYYY-MM-DD");
  return dailyNoteLeaveCache.has(dateKey);
}

// ===== Cache Invalidation =====

export function invalidateHolidayCache(): void {
  yearCache.clear();
  loadingPromise = null;
}

export function invalidateLeaveCache(): void {
  dailyNoteLeaveCache.clear();
  dailyNoteCacheBuilt = false;
}

export function invalidateAllCache(): void {
  invalidateHolidayCache();
  invalidateLeaveCache();
}

// ===== Calendar Source =====

export const leaveDaySource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const currentSettings = get(settings) as ISettings;
    if (!currentSettings?.showDayMarkers) return {};

    // Determine which years we need (current ± 1 for boundary safety)
    const years = [date.year() - 1, date.year(), date.year() + 1];
    await ensureYearsLoaded(years);

    const holiday = getHolidayForDate(date);
    const isLeave = isLeaveDay(date);

    const classes: string[] = [];
    const dataAttributes: Record<string, string> = {};

    if (isLeave) {
      classes.push("is-leave-day");
      dataAttributes["data-day-marker"] = "leave";
      dataAttributes["data-day-marker-name"] = "请假";
    } else if (holiday) {
      if (holiday.holiday) {
        // 真正的节假日（休息）
        classes.push("is-holiday");
        dataAttributes["data-day-marker"] = "holiday";
        dataAttributes["data-day-marker-name"] = holiday.name || "节假日";
      } else {
        // 调休补班日（周末但需上班）
        classes.push("is-makeup-workday");
        dataAttributes["data-day-marker"] = "makeup-workday";
        dataAttributes["data-day-marker-name"] = holiday.name || "补班";
      }
    } else {
      // Check if weekend (non-workday) — only when no holiday/leave marker applies
      const dayOfWeek = date.day();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        classes.push("is-nonworkday");
        dataAttributes["data-day-marker"] = "non-workday";
        dataAttributes["data-day-marker-name"] = "非工作日";
      }
    }

    return { classes, dataAttributes };
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    return {};
  },
};
