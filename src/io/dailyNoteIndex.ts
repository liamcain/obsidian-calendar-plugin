import { normalizePath, TFile, TFolder, Vault } from "obsidian";
import {
  DailyNotesFolderMissingError,
  getDailyNoteSettings,
  getDateUID,
} from "obsidian-daily-notes-interface";

/** Index only paths that Daily Notes would create, including date subfolders. */
export function getAllDailyNotes(): Record<string, TFile> {
  const { vault } = window.app;
  const { folder = "", format = "YYYY-MM-DD" } = getDailyNoteSettings();
  const folderPath = folder ? normalizePath(folder) : "";
  const root = folderPath ? vault.getAbstractFileByPath(folderPath) : vault.getRoot();
  if (!(root instanceof TFolder)) {
    throw new DailyNotesFolderMissingError("Failed to find daily notes folder");
  }
  const prefix = folderPath ? `${folderPath}/` : "";
  const notes: Record<string, TFile> = {};
  Vault.recurseChildren(root, (file) => {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    const relativePath = file.path.slice(prefix.length, -3);
    const date = window.moment(relativePath, format, true);
    if (!date.isValid()) return;
    // Round-trip the entire relative path; basename-only matching can select
    // attachments or archived notes with the same date, depending on traversal.
    const expectedPath = normalizePath(`${prefix}${date.format(format)}.md`);
    if (file.path === expectedPath) notes[getDateUID(date, "day")] = file;
  });
  return notes;
}
