import moment from "moment";
import { TFile } from "obsidian";
import { getDateUID, getWeeklyNoteSettings } from "obsidian-daily-notes-interface";

import mockApp from "src/testUtils/mockApp";

import { getWeeklyNote, getWeeklyNoteDate } from "./weeklyNotes";

jest.mock(
  "obsidian",
  () => ({
    Modal: class {},
    TFile: class {},
    normalizePath: (path: string) => path.replace(/^\/+|\/+$/g, ""),
  }),
  { virtual: true }
);

jest.mock("obsidian-daily-notes-interface", () => ({
  ...jest.requireActual("obsidian-daily-notes-interface"),
  getWeeklyNoteSettings: jest.fn(),
}));

const getAbstractFileByPath = jest.fn();
const getSettings = getWeeklyNoteSettings as jest.MockedFunction<
  typeof getWeeklyNoteSettings
>;
const weekIn2025 = moment("2025-11-27");
const weekIn2026 = moment("2026-11-25");

function note(path: string): TFile {
  return Object.assign(new TFile(), { path });
}

beforeEach(() => {
  getAbstractFileByPath.mockReset();
  window.app = mockApp;
  window.app.vault.getAbstractFileByPath = getAbstractFileByPath;
  getSettings.mockReturnValue({
    folder: "Weekly",
    format: "YYYY/Qo/ww",
    template: "",
  });
});

it("does not open last year's note when the requested week has no file", () => {
  const oldNote = note("Weekly/2025/4th/48.md");
  getAbstractFileByPath.mockImplementation((path) =>
    path === oldNote.path ? oldNote : null
  );
  const index = { [getDateUID(weekIn2026, "week")]: oldNote };

  expect(getWeeklyNote(weekIn2026, index)).toBeNull();
  expect(getWeeklyNote(weekIn2025, index)).toBe(oldNote);
});

it("finds same-named notes in the requested year", () => {
  const oldNote = note("Weekly/2025/4th/48.md");
  const newNote = note("Weekly/2026/4th/48.md");
  const notes = [oldNote, newNote];
  getAbstractFileByPath.mockImplementation((path) =>
    notes.find((file) => file.path === path)
  );

  expect(getWeeklyNote(weekIn2025, {})).toBe(oldNote);
  expect(getWeeklyNote(weekIn2026, {})).toBe(newNote);
});

it("uses the week start to format the path at a year boundary", () => {
  getSettings.mockReturnValue({
    folder: "",
    format: "YYYY/Qo/[W]ww[.md]",
    template: "",
  });
  const file = note("2025/4th/W01.md");
  getAbstractFileByPath.mockImplementation((path) =>
    path === file.path ? file : null
  );

  expect(getWeeklyNote(moment("2026-01-02"), {})).toBe(file);
  expect(getAbstractFileByPath).toHaveBeenCalledWith(file.path);
});

it("keeps indexed lookup for archived notes whose filenames include the year", () => {
  getSettings.mockReturnValue({
    folder: "Weekly",
    format: "YYYY/gggg-[W]ww",
    template: "",
  });
  const file = note("Weekly/Archive/2026-W48.md");
  const index = { [getDateUID(weekIn2026, "week")]: file };

  expect(getWeeklyNote(weekIn2026, index)).toBe(file);
});

it("uses the ISO week-year when it is in the directory", () => {
  getSettings.mockReturnValue({
    folder: "./Weekly/",
    format: "GGGG/[W]WW",
    template: "",
  });
  const file = note("Weekly/2020/W53.md");
  getAbstractFileByPath.mockImplementation((path) =>
    path === file.path ? file : null
  );

  expect(getWeeklyNote(moment("2021-01-03"), {})).toBe(file);
});

it("only marks the selected week when its path identifies the opened file", () => {
  const file = note("Weekly/2025/4th/48.md");

  expect(getWeeklyNoteDate(file, weekIn2026)).toBeNull();
  expect(getWeeklyNoteDate(file, weekIn2025)).toBe(weekIn2025);
});
