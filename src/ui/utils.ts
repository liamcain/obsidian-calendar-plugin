import type { TFile } from "obsidian";

export function getNumberOfDots(dailyNoteFile?: TFile) {
  if (!dailyNoteFile) {
    return 0;
  }

  const fileStats = dailyNoteFile.stat as any;
  const fileSize = fileStats.size || 0;

  return Math.floor(Math.log(fileSize / 20));
}
