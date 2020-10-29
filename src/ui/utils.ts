import type { TFile } from "obsidian";

const NUM_MAX_DOTS = 6;

export function getNumberOfDots(dailyNoteFile?: TFile) {
  if (!dailyNoteFile) {
    return 0;
  }

  const fileStats = dailyNoteFile.stat as any;
  const fileSize = fileStats.size || 0;

  return fileSize
    ? Math.min(NUM_MAX_DOTS, Math.floor(Math.log(fileSize / 20)))
    : 0;
}
