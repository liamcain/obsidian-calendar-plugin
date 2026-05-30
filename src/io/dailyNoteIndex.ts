import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  DEFAULT_DAILY_NOTE_FORMAT,
  getDailyNote,
  getDailyNoteSettings,
  getDateUID,
} from "obsidian-daily-notes-interface";

export type DailyNotesByDate = Record<string, TFile[]>;
export type DailyNotesByDateMap = Record<string, TFile>;

export interface DailyNoteIndexOptions {
  filenameDateFormat?: string;
  frontmatterDateFields?: string;
  includedFolders?: string;
}

export function buildDailyNotesByDate(
  files: TFile[],
  options: DailyNoteIndexOptions | string = ""
): DailyNotesByDate {
  const notesByDate: DailyNotesByDate = {};
  const indexOptions = normalizeIndexOptions(options);
  const { format = DEFAULT_DAILY_NOTE_FORMAT } = getDailyNoteSettings();
  const includedFolders = getIncludedFolders(indexOptions.includedFolders ?? "");
  const frontmatterDateFields = getListValues(
    indexOptions.frontmatterDateFields ?? ""
  );

  files.forEach((file) => {
    if (!shouldIndexFile(file, includedFolders)) {
      return;
    }

    const date = getDateFromFilename(
      file.basename,
      format,
      indexOptions.filenameDateFormat
    );
    const noteDate = date.isValid()
      ? date
      : getDateFromFrontmatter(
          file,
          frontmatterDateFields,
          getExtractionFormats(format, indexOptions.filenameDateFormat ?? "")
        );
    if (!noteDate.isValid()) {
      return;
    }

    const id = getDateUID(noteDate, "day");
    const notes = notesByDate[id] ?? [];
    notes.push(file);
    notesByDate[id] = notes;
  });

  Object.values(notesByDate).forEach((files) =>
    files.sort((a, b) => a.path.localeCompare(b.path))
  );

  return notesByDate;
}

function normalizeIndexOptions(
  options: DailyNoteIndexOptions | string
): DailyNoteIndexOptions {
  if (typeof options === "string") {
    return { filenameDateFormat: options };
  }
  return options;
}

export function getDateFromFilename(
  basename: string,
  dailyNoteFormat: string,
  filenameDateFormat = ""
): Moment {
  const exactDate = window.moment(basename, dailyNoteFormat, true);
  if (exactDate.isValid()) {
    return exactDate;
  }

  for (const extractionFormat of getExtractionFormats(
    dailyNoteFormat,
    filenameDateFormat
  )) {
    const candidateLengths = getCandidateLengths(extractionFormat);
    for (const length of candidateLengths) {
      for (let start = 0; start <= basename.length - length; start++) {
        const candidate = basename.substring(start, start + length);
        const embeddedDate = window.moment(candidate, extractionFormat, true);
        if (embeddedDate.isValid()) {
          return embeddedDate;
        }
      }
    }
  }

  return exactDate;
}

export function getDateFromFrontmatter(
  file: TFile,
  frontmatterDateFields: string[],
  formats: string[]
): Moment {
  if (!frontmatterDateFields.length) {
    return window.moment.invalid();
  }

  const frontmatter = window.app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter) {
    return window.moment.invalid();
  }

  for (const field of frontmatterDateFields) {
    const date = getDateFromFrontmatterValue(
      getFrontmatterValue(frontmatter, field),
      formats
    );
    if (date.isValid()) {
      return date;
    }
  }

  return window.moment.invalid();
}

function getExtractionFormats(
  dailyNoteFormat: string,
  filenameDateFormat: string
): string[] {
  return Array.from(
    new Set([
      dailyNoteFormat,
      ...filenameDateFormat
        .split(",")
        .map((format) => format.trim())
        .filter(Boolean),
    ])
  );
}

function getDateFromFrontmatterValue(value: unknown, formats: string[]): Moment {
  if (Array.isArray(value)) {
    for (const item of value) {
      const date = getDateFromFrontmatterValue(item, formats);
      if (date.isValid()) {
        return date;
      }
    }
    return window.moment.invalid();
  }

  if (value instanceof Date) {
    return window.moment(value);
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return window.moment.invalid();
  }

  const valueText = String(value).trim();
  for (const format of getFrontmatterFormats(formats)) {
    const date = window.moment(valueText, format, true);
    if (date.isValid()) {
      return date;
    }
  }

  const isoDate = window.moment(valueText, window.moment.ISO_8601, true);
  return isoDate.isValid() ? isoDate : window.moment.invalid();
}

function getFrontmatterFormats(formats: string[]): string[] {
  return Array.from(
    new Set([
      ...formats,
      "YYYY-MM-DD",
      "YYYYMMDD",
    ])
  );
}

function getFrontmatterValue(
  frontmatter: Record<string, unknown>,
  field: string
): unknown {
  return field.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }
    return (value as Record<string, unknown>)[key];
  }, frontmatter);
}

function getIncludedFolders(includedFolders: string): string[] {
  return getListValues(includedFolders).map((folder) =>
    folder.replace(/^\/+|\/+$/g, "")
  );
}

function getListValues(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function shouldIndexFile(file: TFile, includedFolders: string[]): boolean {
  if (!includedFolders.length) {
    return true;
  }

  return includedFolders.some((folder) => {
    if (folder === "." || folder === "/") {
      return true;
    }
    return file.path === `${folder}.md` || file.path.startsWith(`${folder}/`);
  });
}

function getCandidateLengths(format: string): number[] {
  const sampleDates = [
    window.moment("2000-01-02", "YYYY-MM-DD"),
    window.moment("2000-11-22", "YYYY-MM-DD"),
  ];

  return Array.from(
    new Set(sampleDates.map((date) => date.format(format).length))
  ).sort((a, b) => b - a);
}

export function dailyNotesByDateToSingleNotes(
  notesByDate: DailyNotesByDate
): DailyNotesByDateMap {
  return Object.entries(notesByDate).reduce<DailyNotesByDateMap>(
    (notes, [dateUID, files]) => {
      const firstFile = files[0];
      if (firstFile) {
        notes[dateUID] = firstFile;
      }
      return notes;
    },
    {}
  );
}

export function singleDailyNotesToDailyNotesByDate(
  dailyNotes: DailyNotesByDateMap
): DailyNotesByDate {
  return Object.entries(dailyNotes).reduce<DailyNotesByDate>(
    (notes, [dateUID, file]) => {
      notes[dateUID] = [file];
      return notes;
    },
    {}
  );
}

export function getDailyNotesForDate(
  date: Moment,
  notesByDate: DailyNotesByDate,
  fallbackDailyNotes: DailyNotesByDateMap | null
): TFile[] {
  const dateUID = getDateUID(date, "day");
  const matchingNotes = notesByDate?.[dateUID];

  if (matchingNotes?.length) {
    return matchingNotes;
  }

  const dailyNote = getDailyNote(date, fallbackDailyNotes ?? {});
  return dailyNote ? [dailyNote] : [];
}
