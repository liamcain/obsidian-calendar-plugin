import toInteger from "lodash/toInteger";
import type { TFile } from "obsidian";

const NUM_MAX_DOTS = 6;

export function getNumberOfDots(dailyNoteFile?: TFile): number {
  if (!dailyNoteFile) {
    return 0;
  }

  try {
    const fileSize = toInteger(dailyNoteFile.stat.size);
    return fileSize
      ? Math.min(NUM_MAX_DOTS, Math.floor(Math.log(fileSize / 20)))
      : 0;
  } catch (err) {
    return 0;
  }
}
