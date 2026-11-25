import type { Moment } from "moment";
import { normalizePath, TFile } from "obsidian";
import {
  createWeeklyNote,
  getDateFromFile,
  getWeeklyNote as getIndexedWeeklyNote,
  getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

export function hasWeeklyYearInDirectory(format: string): boolean {
  // Keep slashes in literals, since they still separate path components.
  const tokens = format
    .replace(/\[[^\]]*\]/g, (literal) => literal.replace(/[^/]/g, ""))
    .replace(/\\[^/]/g, "");
  const separator = tokens.lastIndexOf("/");
  const yearToken = /Y|gg|GG/;
  return (
    separator >= 0 &&
    yearToken.test(tokens.slice(0, separator)) &&
    !yearToken.test(tokens.slice(separator + 1))
  );
}

function getWeeklyNotePath(date: Moment, folder: string, format: string): string {
  const name = date.clone().startOf("week").format(format);
  const filename = name.endsWith(".md") ? name : `${name}.md`;
  const path = `${folder}/${filename}`
    .split("/")
    .filter((part) => part && part !== ".")
    .join("/");
  return normalizePath(path);
}

export function getWeeklyNote(
  date: Moment,
  index: Record<string, TFile>
): TFile | null {
  const { folder, format } = getWeeklyNoteSettings();

  if (!hasWeeklyYearInDirectory(format)) {
    return getIndexedWeeklyNote(date, index);
  }

  // Resolve the same path that creation would use. A filename-only fallback
  // here would turn a missing note into a match against another year's file.
  const path = getWeeklyNotePath(date, folder, format);
  const file = window.app.vault.getAbstractFileByPath(path);
  return file instanceof TFile ? file : null;
}

export function getWeeklyNoteDate(
  file: TFile,
  selectedWeek?: Moment
): Moment | null {
  const { folder, format } = getWeeklyNoteSettings();
  const date = selectedWeek ?? getDateFromFile(file, "week");
  if (date && hasWeeklyYearInDirectory(format)) {
    return getWeeklyNotePath(date, folder, format) === file.path ? date : null;
  }
  return date;
}

/**
 * Create a Weekly Note for a given date.
 */
export async function tryToCreateWeeklyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (file: TFile) => void
): Promise<void> {
  const { workspace } = window.app;
  const { format } = getWeeklyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const dailyNote = await createWeeklyNote(date);
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();

    await leaf.openFile(dailyNote, { active : true });
    cb?.(dailyNote);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Weekly Note",
    });
  } else {
    await createFile();
  }
}
