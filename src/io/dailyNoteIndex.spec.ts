import moment from "moment";
import type { TFile } from "obsidian";
import {
  getDailyNote,
  getDailyNoteSettings,
  getDateUID,
} from "obsidian-daily-notes-interface";

import {
  buildDailyNotesByDate,
  dailyNotesByDateToSingleNotes,
  getDateFromFilename,
  getDailyNotesForDate,
  singleDailyNotesToDailyNotesByDate,
} from "./dailyNoteIndex";

jest.mock("obsidian-daily-notes-interface", () => ({
  DEFAULT_DAILY_NOTE_FORMAT: "YYYY-MM-DD",
  getDailyNote: jest.fn(),
  getDailyNoteSettings: jest.fn(),
  getDateUID: jest.fn(),
}));

const mockGetDailyNote = getDailyNote as jest.MockedFunction<
  typeof getDailyNote
>;
const mockGetDailyNoteSettings = getDailyNoteSettings as jest.MockedFunction<
  typeof getDailyNoteSettings
>;
const mockGetDateUID = getDateUID as jest.MockedFunction<typeof getDateUID>;
let frontmatterByPath: Record<string, Record<string, unknown>>;

function file(path: string): TFile {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return {
    basename: name.replace(/\.md$/, ""),
    name,
    path,
  } as TFile;
}

describe("dailyNoteIndex", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).moment = moment;
    frontmatterByPath = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).app = {
      metadataCache: {
        getFileCache: jest.fn((note) => ({
          frontmatter: frontmatterByPath[note.path],
        })),
      },
    };
    mockGetDailyNoteSettings.mockReturnValue({
      format: "YYYY-MM-DD",
      folder: "",
      template: "",
    });
    mockGetDateUID.mockImplementation((date) => date.format("YYYY-MM-DD"));
    mockGetDailyNote.mockImplementation((date, dailyNotes) => {
      return dailyNotes[date.format("YYYY-MM-DD")] ?? null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("groups every daily note by date and sorts matches by path", () => {
    const workNote = file("Work/2024-12-31.md");
    const journalNote = file("Journal/2024-12-31.md");
    const nextDayNote = file("Journal/2025-01-01.md");
    const nonDailyNote = file("Ideas/not-a-daily-note.md");

    const notesByDate = buildDailyNotesByDate([
      workNote,
      nonDailyNote,
      nextDayNote,
      journalNote,
    ]);

    expect(notesByDate).toEqual({
      "2024-12-31": [journalNote, workNote],
      "2025-01-01": [nextDayNote],
    });
  });

  it("groups notes by an embedded date in the file name", () => {
    const newsletterNote = file("Newsletters/Market News 2024-12-31.md");
    const trackerNote = file("Projects/Tracker 20241231.md");
    const nextDayNote = file("Journal/plan 20250101.md");
    const nonDailyNote = file("Ideas/not-a-daily-note.md");

    const notesByDate = buildDailyNotesByDate(
      [newsletterNote, nonDailyNote, nextDayNote, trackerNote],
      "YYYYMMDD"
    );

    expect(notesByDate).toEqual({
      "2024-12-31": [newsletterNote, trackerNote],
      "2025-01-01": [nextDayNote],
    });
  });

  it("supports multiple extra embedded date formats", () => {
    const compactDateNote = file("Projects/Tracker 20241231.md");
    const underscoreDateNote = file("Reports/report 2024_12_31.md");

    const notesByDate = buildDailyNotesByDate(
      [compactDateNote, underscoreDateNote],
      "YYYYMMDD, YYYY_MM_DD"
    );

    expect(notesByDate).toEqual({
      "2024-12-31": [compactDateNote, underscoreDateNote],
    });
  });

  it("uses frontmatter as a fallback when the file name has no date", () => {
    const marketNote = file("Research/market update.md");
    frontmatterByPath[marketNote.path] = {
      date: "2024-12-31",
    };

    const notesByDate = buildDailyNotesByDate([marketNote], {
      frontmatterDateFields: "date",
    });

    expect(notesByDate).toEqual({
      "2024-12-31": [marketNote],
    });
  });

  it("keeps the file name date when frontmatter disagrees", () => {
    const trackerNote = file("Projects/Tracker 20250101.md");
    frontmatterByPath[trackerNote.path] = {
      date: "2024-12-31",
    };

    const notesByDate = buildDailyNotesByDate([trackerNote], {
      filenameDateFormat: "YYYYMMDD",
      frontmatterDateFields: "date",
    });

    expect(notesByDate).toEqual({
      "2025-01-01": [trackerNote],
    });
  });

  it("supports configured nested frontmatter fields and date arrays", () => {
    const planningNote = file("Projects/planning.md");
    frontmatterByPath[planningNote.path] = {
      calendar: {
        dates: ["not-a-date", "2024-12-31"],
      },
    };

    const notesByDate = buildDailyNotesByDate([planningNote], {
      frontmatterDateFields: "date, calendar.dates",
    });

    expect(notesByDate).toEqual({
      "2024-12-31": [planningNote],
    });
  });

  it("limits matching to configured folders", () => {
    const includedNote = file("Research/Daily/market update.md");
    const excludedNote = file("Archive/market update.md");
    frontmatterByPath[includedNote.path] = {
      date: "2024-12-31",
    };
    frontmatterByPath[excludedNote.path] = {
      date: "2024-12-31",
    };

    const notesByDate = buildDailyNotesByDate([includedNote, excludedNote], {
      frontmatterDateFields: "date",
      includedFolders: "Research/Daily",
    });

    expect(notesByDate).toEqual({
      "2024-12-31": [includedNote],
    });
  });

  it("matches the whole basename before trying an embedded date", () => {
    const date = getDateFromFilename(
      "2024-12-31",
      "YYYY-MM-DD",
      "YYYYMMDD"
    );

    expect(date.format("YYYY-MM-DD")).toBe("2024-12-31");
  });

  it("returns an invalid date when neither the basename nor embedded date matches", () => {
    const date = getDateFromFilename(
      "notes without a date",
      "YYYY-MM-DD",
      "YYYYMMDD"
    );

    expect(date.isValid()).toBe(false);
  });

  it("keeps the first sorted daily note for calendar metadata sources", () => {
    const journalNote = file("Journal/2024-12-31.md");
    const workNote = file("Work/2024-12-31.md");

    expect(
      dailyNotesByDateToSingleNotes({
        "2024-12-31": [journalNote, workNote],
      })
    ).toEqual({
      "2024-12-31": journalNote,
    });
  });

  it("converts single-note maps into grouped daily notes", () => {
    const journalNote = file("Journal/2024-12-31.md");

    expect(
      singleDailyNotesToDailyNotesByDate({
        "2024-12-31": journalNote,
      })
    ).toEqual({
      "2024-12-31": [journalNote],
    });
  });

  it("returns every note mapped to a date before falling back to a single note", () => {
    const journalNote = file("Journal/2024-12-31.md");
    const workNote = file("Work/2024-12-31.md");
    const fallbackNote = file("Daily notes/2024-12-31.md");

    const result = getDailyNotesForDate(
      moment("2024-12-31", "YYYY-MM-DD"),
      {
        "2024-12-31": [journalNote, workNote],
      },
      {
        "2024-12-31": fallbackNote,
      }
    );

    expect(result).toEqual([journalNote, workNote]);
    expect(mockGetDailyNote).not.toHaveBeenCalled();
  });

  it("falls back to the original daily-note lookup", () => {
    const fallbackNote = file("Daily notes/2024-12-31.md");

    const result = getDailyNotesForDate(
      moment("2024-12-31", "YYYY-MM-DD"),
      {},
      {
        "2024-12-31": fallbackNote,
      }
    );

    expect(result).toEqual([fallbackNote]);
  });
});
