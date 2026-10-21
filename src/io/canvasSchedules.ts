import type { Moment } from "moment";
import type { TFile } from "obsidian";

import type { ISettings } from "src/settings";

/**
 * A single schedule entry extracted from a canvas text node.
 */
export interface CanvasSchedule {
  /** Node id from the canvas file (e.g. "2026082715590000"). */
  id: string;
  /** The date parsed from the memos-meta comment. */
  date: Moment;
  /** The schedule content (task text with checkbox prefix stripped). */
  content: string;
  /** The canvas file this schedule came from. */
  file: TFile;
}

/**
 * Parse the date from a memos-meta comment.
 * Format: <!-- memos-meta | updated: 2026-08-27 15:59:30 -->
 * Returns null if no valid date is found.
 */
export function parseMemosMetaDate(text: string): Moment | null {
  const match = text.match(
    /<!--\s*memos-meta\s*\|\s*updated:\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2})(?::\d{2})?)?/
  );
  if (!match) {
    return null;
  }
  const value = match[2] ? `${match[1]} ${match[2]}` : match[1];
  const format = match[2] ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD";
  const date = window.moment(value, format, true);
  if (!date.isValid()) {
    return null;
  }
  return date;
}

/**
 * Parse schedule entries from a canvas file's JSON content.
 * Only text nodes are considered. The memos-meta comment is stripped
 * from the node text, and the remaining content is treated as the
 * schedule (checkbox prefixes like "- [ ]" are removed).
 */
export function parseCanvasContent(
  content: string,
  file: TFile
): CanvasSchedule[] {
  let data: { nodes?: Array<Record<string, unknown>> };
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.log("[Calendar] Failed to parse canvas file", file.path, err);
    return [];
  }

  const schedules: CanvasSchedule[] = [];
  const nodes = Array.isArray(data?.nodes) ? data.nodes : [];

  for (const node of nodes) {
    if (node?.type !== "text" || typeof node.text !== "string") {
      continue;
    }
    const text = node.text;
    const date = parseMemosMetaDate(text);
    if (!date) {
      continue;
    }

    // Strip the memos-meta comment line
    const contentLines = text
      .split("\n")
      .filter((line) => !line.match(/<!--\s*memos-meta/));

    // Extract schedule content: reuse the same task regex as monthly notes
    const scheduleLines: string[] = [];
    for (const line of contentLines) {
      const taskMatch = line.match(/^\s*[-*]\s+(?:\[[ xX]\]\s+)?(.+)/);
      if (taskMatch) {
        scheduleLines.push(taskMatch[1].trim());
      } else if (line.trim()) {
        scheduleLines.push(line.trim());
      }
    }

    if (scheduleLines.length === 0) {
      continue;
    }

    schedules.push({
      id: String(node.id ?? ""),
      date,
      content: scheduleLines.join("\n"),
      file,
    });
  }

  return schedules;
}

/**
 * Check whether a file is a canvas file within the configured folder.
 */
export function isCanvasScheduleFile(
  file: TFile,
  settings: ISettings
): boolean {
  if (file.extension !== "canvas") {
    return false;
  }
  const folder = (settings.canvasSchedulesFolder?.trim() || "").replace(
    /\/$/,
    ""
  );
  if (folder && file.path !== folder && !file.path.startsWith(`${folder}/`)) {
    return false;
  }
  return true;
}

/**
 * Get all canvas files from the configured folder.
 * If the folder is empty, scan the whole vault.
 */
export function getCanvasFiles(settings: ISettings): TFile[] {
  const { vault } = window.app;
  return vault.getFiles().filter((file) => isCanvasScheduleFile(file, settings));
}

/**
 * Get all schedules from all canvas files, indexed by YYYY-MM-DD.
 */
export async function getAllCanvasSchedules(
  settings: ISettings
): Promise<Record<string, CanvasSchedule[]>> {
  const { vault } = window.app;
  const files = getCanvasFiles(settings);
  const schedules: Record<string, CanvasSchedule[]> = {};

  for (const file of files) {
    let content: string;
    try {
      content = await vault.cachedRead(file);
    } catch (err) {
      console.log("[Calendar] Failed to read canvas file", file.path, err);
      continue;
    }
    const parsed = parseCanvasContent(content, file);
    for (const schedule of parsed) {
      const key = schedule.date.format("YYYY-MM-DD");
      if (!schedules[key]) {
        schedules[key] = [];
      }
      schedules[key].push(schedule);
    }
  }

  return schedules;
}

/**
 * Get the schedules for a specific day.
 */
export function getCanvasSchedulesForDay(
  date: Moment,
  schedules: Record<string, CanvasSchedule[]>
): CanvasSchedule[] {
  return schedules[date.format("YYYY-MM-DD")] || [];
}