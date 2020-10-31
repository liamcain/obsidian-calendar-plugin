import clamp from "lodash/clamp";
import isNumber from "lodash/isNumber";
import toInteger from "lodash/toInteger";
import type { TFile } from "obsidian";

const NUM_MAX_DOTS = 6;

export function getNumberOfDots(dailyNoteFile?: TFile): number {
  if (!dailyNoteFile) {
    return 0;
  }
  const fileSize = toInteger(dailyNoteFile.stat.size);
  if (!fileSize) {
    return 0;
  }

  const numDots = Math.floor(Math.log(fileSize / 20));
  return isNumber(numDots) ? clamp(numDots, 0, NUM_MAX_DOTS) : 0;
}
