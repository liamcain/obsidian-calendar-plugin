import type { TFile } from "obsidian";

const NUM_MAX_DOTS = 6;

function clamp(num: number, lowerBound: number, upperBound: number) {
  return Math.min(Math.max(lowerBound, num), upperBound);
}

function isNumber(possibleNumber: any) {
  return !isNaN(possibleNumber) && isFinite(possibleNumber);
}

export function getNumberOfDots(dailyNoteFile?: TFile): number {
  if (!dailyNoteFile) {
    return 0;
  }
  const fileSize = dailyNoteFile.stat.size;
  if (!fileSize) {
    return 0;
  }
  if (typeof fileSize === "bigint") {
    return NUM_MAX_DOTS;
  }

  const numDots = Math.floor(Math.log(fileSize / 30));
  return isNumber(numDots) ? clamp(numDots, 1, NUM_MAX_DOTS) : 0;
}
