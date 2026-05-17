import type { Moment } from "moment";
import { normalizePath, TFile, TFolder, Vault } from "obsidian";
import {
  createDailyNote,
  DailyNotesFolderMissingError,
  getDailyNoteSettings,
  getDateUID,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";
import { parseDailyNoteDateFromBasename } from "./dailyNoteFilenames";

export function getDailyDateFromFile(
  file: TFile,
  allowTitleSuffix: boolean
): Moment | null {
  const { format } = getDailyNoteSettings();
  return parseDailyNoteDateFromBasename(
    file.basename,
    format,
    allowTitleSuffix
  );
}

export function getAllDailyNotes(options: {
  allowTitleSuffix: boolean;
}): Record<string, TFile> {
  const { vault } = window.app;
  const { folder } = getDailyNoteSettings();
  const dailyNotesFolder = vault.getAbstractFileByPath(normalizePath(folder));
  if (!(dailyNotesFolder instanceof TFolder)) {
    throw new DailyNotesFolderMissingError("Failed to find daily notes folder");
  }

  const dailyNotes: Record<string, TFile> = {};
  Vault.recurseChildren(dailyNotesFolder, (note) => {
    if (note instanceof TFile) {
      const date = getDailyDateFromFile(note, options.allowTitleSuffix);
      if (date) {
        dailyNotes[getDateUID(date, "day")] = note;
      }
    }
  });
  return dailyNotes;
}

/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreateDailyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace } = window.app;
  const { format } = getDailyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const dailyNote = await createDailyNote(date);
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
      title: "New Daily Note",
    });
  } else {
    await createFile();
  }
}
