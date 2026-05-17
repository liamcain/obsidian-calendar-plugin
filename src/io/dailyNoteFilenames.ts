import type { Moment } from "moment";

function getFilenameFormat(format: string): string {
  return format.split("/").pop();
}

function isTitleSuffixBoundary(character: string): boolean {
  return /[\s._\-–—()[\]]/.test(character);
}

export function parseDailyNoteDateFromBasename(
  basename: string,
  format: string,
  allowTitleSuffix: boolean
): Moment | null {
  const filenameFormat = getFilenameFormat(format);

  if (!allowTitleSuffix) {
    const date = window.moment(basename, filenameFormat, true);
    return date.isValid() ? date : null;
  }

  for (let index = 1; index <= basename.length; index += 1) {
    const candidate = basename.slice(0, index);
    const date = window.moment(candidate, filenameFormat, true);
    if (
      date.isValid() &&
      (index === basename.length || isTitleSuffixBoundary(basename[index]))
    ) {
      return date;
    }
  }

  return null;
}
