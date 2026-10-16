import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

export const DEFAULT_MONTHLY_FORMAT = "YYYY-MM";
export const DEFAULT_YEARLY_FORMAT = "YYYY";

/**
 * Find the content range for a day within a specific month section.
 */
export function findMonthlyDayRange(
  content: string,
  month: string,
  day: string
): { start: number; end: number } | null {
  const lines = content.split("\n");
  let currentMonth = "";
  let start = -1;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^#{1,2}\s/.test(line)) {
      if (start !== -1) return { start, end: index };
      const monthMatch = line.match(/^#\s+(\d{4}-\d{2})(?:\s|$)/);
      if (/^#\s/.test(line)) currentMonth = monthMatch?.[1] || "";
      const dayMatch = line.match(/^##\s+(\d{1,2})(?:\s|$)/);
      if (currentMonth === month && dayMatch && Number(dayMatch[1]) === Number(day)) {
        start = index + 1;
      }
    }
  }

  return start === -1 ? null : { start, end: lines.length };
}

/**
 * Get the folder path for monthly notes.
 * Uses the daily notes folder from Obsidian settings.
 */
export function getMonthlyNoteFolder(): string {
  const { folder } = getDailyNoteSettings();
  return folder || "";
}

/**
 * Get the format for monthly notes.
 */
export function getMonthlyNoteFormat(settings: ISettings): string {
  return settings.monthlyNoteFormat || DEFAULT_MONTHLY_FORMAT;
}

/**
 * Get all yearly files used to store monthly notes from the vault.
 */
export function getAllMonthlyNotes(): Record<string, TFile> {
  const { vault } = window.app;
  const { folder } = getDailyNoteSettings();
  const notes: Record<string, TFile> = {};

  vault.getMarkdownFiles().forEach((file) => {
    if (folder && !file.path.startsWith(folder)) {
      return;
    }
    // Match YYYY format exactly (not YYYY-MM monthly notes or daily notes)
    const match = file.basename.match(/^(\d{4})$/);
    if (match) {
      notes[match[1]] = file;
    }
  });

  return notes;
}

/**
 * Get a specific monthly note by date.
 */
export function getMonthlyNote(
  date: Moment,
  monthlyNotes: Record<string, TFile>
): TFile | null {
  const yearKey = date.format(DEFAULT_YEARLY_FORMAT);
  return monthlyNotes[yearKey] || null;
}

/**
 * Parse tasks from monthly note content.
 * Format:
 * ## DD
 * - [ ] task1
 * - [ ] task2
 *
 * Returns a map of day -> tasks array
 */
export function parseMonthlyNoteTasks(
  content: string,
  monthKey?: string
): Record<string, string[]> {
  const tasks: Record<string, string[]> = {};
  const lines = content.split("\n");
  let currentMonth = "";
  let currentDay = "";

  for (const line of lines) {
    const monthMatch = line.match(/^#\s+(\d{4}-\d{2})(?:\s|$)/);
    if (monthMatch) {
      currentMonth = monthMatch[1];
      currentDay = "";
      continue;
    }

    // Match day header: ## 01, ## 1, ## 01-some text, etc.
    const dayMatch = line.match(/^##\s+(\d{1,2})(?:\s|$)/);
    if (dayMatch) {
      currentDay = dayMatch[1].padStart(2, "0");
      if ((!monthKey || currentMonth === monthKey) && !tasks[currentDay]) {
        tasks[currentDay] = [];
      }
      continue;
    }

    // Match task items: - [ ] task or - [x] task or - task
    if (currentDay && (!monthKey || currentMonth === monthKey) && line.match(/^\s*[-*]\s+/)) {
      const taskMatch = line.match(/^\s*[-*]\s+(?:\[[ xX]\]\s+)?(.+)/);
      if (taskMatch) {
        tasks[currentDay].push(taskMatch[1].trim());
      }
    }
  }

  return tasks;
}

/**
 * Parse day sections from monthly note content with full markdown.
 * Returns a map of day -> raw markdown content for that section.
 */
export function parseMonthlyNoteSections(
  content: string,
  monthKey?: string
): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentMonth = "";
  let currentDay = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const monthMatch = line.match(/^#\s+(\d{4}-\d{2})(?:\s|$)/);
    if (monthMatch) {
      if (currentDay && currentLines.length > 0 && (!monthKey || currentMonth === monthKey)) {
        sections[currentDay] = currentLines.join("\n").trim();
      }
      currentMonth = monthMatch[1];
      currentDay = "";
      currentLines = [];
      continue;
    }

    const dayMatch = line.match(/^##\s+(\d{1,2})(?:\s|$)/);
    if (dayMatch) {
      // Save previous day's content
      if (currentDay && currentLines.length > 0 && (!monthKey || currentMonth === monthKey)) {
        sections[currentDay] = currentLines.join("\n").trim();
      }
      currentDay = dayMatch[1].padStart(2, "0");
      currentLines = [];
      continue;
    }

    // Stop at next h1 or h2 that's not a day
    if (line.match(/^#\s/) || (line.match(/^##\s/) && !line.match(/^##\s+\d{1,2}/))) {
      if (currentDay && currentLines.length > 0 && (!monthKey || currentMonth === monthKey)) {
        sections[currentDay] = currentLines.join("\n").trim();
      }
      currentDay = "";
      currentLines = [];
      continue;
    }

    if (currentDay && (!monthKey || currentMonth === monthKey)) {
      currentLines.push(line);
    }
  }

  // Save last day's content
  if (currentDay && currentLines.length > 0 && (!monthKey || currentMonth === monthKey)) {
    sections[currentDay] = currentLines.join("\n").trim();
  }

  return sections;
}

/**
 * Serialize tasks back to monthly note content.
 */
export function serializeMonthlyNoteTasks(
  tasks: Record<string, string[]>,
  title: string
): string {
  const lines: string[] = [`# ${title}`, ""];

  // Sort days numerically
  const sortedDays = Object.keys(tasks).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });

  for (const day of sortedDays) {
    if (tasks[day] && tasks[day].length > 0) {
      lines.push(`## ${day}`);
      for (const task of tasks[day]) {
        lines.push(`- [ ] ${task}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Create a monthly note for a given date.
 */
export async function tryToCreateMonthlyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace, vault } = window.app;
  const folder = getMonthlyNoteFolder();
  const filename = date.format(DEFAULT_YEARLY_FORMAT);
  const monthTitle = date.format(DEFAULT_MONTHLY_FORMAT);
  const filePath = folder ? `${folder}/${filename}.md` : `${filename}.md`;

  const createFile = async () => {
    let file = vault.getAbstractFileByPath(filePath) as TFile | null;
    if (file) {
      const content = await vault.read(file);
      if (!content.match(new RegExp(`^#\\s+${monthTitle}(?:\\s|$)`, "m"))) {
        const lines = content.split("\n");
        const targetMonth = monthTitle;
        const nextMonthLine = lines.findIndex((line) => {
          const match = line.match(/^#\s+(\d{4}-\d{2})(?:\s|$)/);
          return match ? match[1] > targetMonth : false;
        });
        const newSection = [`# ${monthTitle}`, ""];
        const insertAt = nextMonthLine >= 0 ? nextMonthLine : lines.length;
        await vault.modify(
          file,
          [...lines.slice(0, insertAt), ...newSection, ...lines.slice(insertAt)].join("\n")
        );
      }
    } else {
      file = await vault.create(filePath, `# ${monthTitle}\n`);
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();

    await leaf.openFile(file, { active: true });
    cb?.(file);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `Yearly note ${filename} does not exist. Would you like to create it?`,
      title: "New Monthly Note",
    });
  } else {
    await createFile();
  }
}

/**
 * Save tasks to a monthly note file.
 */
export async function saveMonthlyNoteTasks(
  file: TFile,
  tasks: Record<string, string[]>,
  monthTitle: string
): Promise<void> {
  const { vault } = window.app;
  const content = serializeMonthlyNoteTasks(tasks, monthTitle);
  await vault.modify(file, content);
}

/**
 * Save content for a specific day section in a monthly note file.
 * Finds the `## DD` header and replaces everything until the next
 * `##` or `#` header (or end of file) with newContent.
 * If the day section doesn't exist, it appends it at the end.
 */
export async function saveDaySection(
  file: TFile,
  month: string,
  day: string,
  newContent: string
): Promise<void> {
  const { vault } = window.app;
  const content = await vault.read(file);
  const lines = content.split("\n");
  const dayPadded = day.padStart(2, "0");

  // Find the requested month first, then limit day-section changes to its range.
  const monthPattern = new RegExp(`^#\\s+${month}(?:\\s|$)`);
  const monthLine = lines.findIndex((line) => monthPattern.test(line));
  let startLine = -1;
  let endLine = lines.length;

  if (monthLine >= 0) {
    const nextMonthLine = lines.findIndex(
      (line, index) => index > monthLine && /^#\s/.test(line)
    );
    const monthEndLine = nextMonthLine >= 0 ? nextMonthLine : lines.length;

    for (let i = monthLine + 1; i < monthEndLine; i++) {
      const dayMatch = lines[i].match(/^##\s+(\d{1,2})(?:\s|$)/);
      if (dayMatch && dayMatch[1].padStart(2, "0") === dayPadded) {
        startLine = i;
        const nextDayOffset = lines.slice(i + 1, monthEndLine).findIndex(
          (line) => /^##\s/.test(line)
        );
        endLine = nextDayOffset >= 0 ? i + 1 + nextDayOffset : monthEndLine;
        break;
      }
    }
  }

  const newLines = newContent.trim() ? newContent.trim().split("\n") : [];
  if (startLine >= 0) {
    // Replace existing section: keep the header line, replace content after it
    const before = lines.slice(0, startLine + 1);
    const after = lines.slice(endLine);
    // Ensure blank line between sections
    const result = [...before, ...newLines, ...(after.length > 0 && after[0] !== "" ? [""] : []), ...after];
    await vault.modify(file, result.join("\n"));
  } else if (monthLine >= 0) {
    const newSection = [`## ${dayPadded}`, ...newLines, ""];
    const monthEndLine = lines.findIndex(
      (line, index) => index > monthLine && /^#\s/.test(line)
    );
    const monthEnd = monthEndLine >= 0 ? monthEndLine : lines.length;
    const nextDayLine = lines.findIndex((line, index) => {
      if (index <= monthLine || index >= monthEnd) return false;
      const dayMatch = line.match(/^##\s+(\d{1,2})(?:\s|$)/);
      return dayMatch ? parseInt(dayMatch[1], 10) > parseInt(dayPadded, 10) : false;
    });
    const insertAt = nextDayLine >= 0 ? nextDayLine : monthEnd;
    const result = [
      ...lines.slice(0, insertAt),
      ...newSection,
      ...lines.slice(insertAt),
    ];
    await vault.modify(file, result.join("\n"));
  } else {
    // Append a new month and day section to the yearly file.
    const newSection = [`# ${month}`, "", `## ${dayPadded}`, ...newLines, ""];
    await vault.modify(file, content.trimEnd() + "\n\n" + newSection.join("\n"));
  }
}
