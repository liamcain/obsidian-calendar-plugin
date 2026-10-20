import moment from "moment";
import { TFile, TFolder } from "obsidian";
import { getAllDailyNotes } from "./dailyNoteIndex";

jest.mock("obsidian", () => ({
  TFile: class { path: string; extension: string; constructor(path: string) { this.path = path; this.extension = path.split(".").pop(); } },
  TFolder: class { children: TFile[] = []; },
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, ""),
  Vault: { recurseChildren: (root: { children: TFile[] }, cb: (file: TFile) => void) => root.children.forEach(cb) },
}), { virtual: true });
jest.mock("obsidian-daily-notes-interface", () => ({
  getDailyNoteSettings: () => mockSettings,
  getDateUID: (date: moment.Moment) => date.format("YYYY-MM-DD"),
  DailyNotesFolderMissingError: class extends Error {},
}));
let mockSettings = { folder: "Journal", format: "YYYY-MM-DD" };
function index(paths: string[], folder = "Journal", format = "YYYY-MM-DD") {
  mockSettings = { folder, format };
  const root = new TFolder();
  root.children = paths.map(path => new (TFile as unknown as { new(path: string): TFile })(path));
  Object.assign(window, { moment, app: { vault: { getAbstractFileByPath: () => root, getRoot: () => root } } });
  const result: Record<string, string> = {};
  Object.entries(getAllDailyNotes()).forEach(([date, file]) => { result[date] = file.path; });
  return result;
}
it.each([false, true])("selects configured path regardless of traversal order (%s)", reverse => {
  const paths = ["Journal/2026-01-14.md", "Journal/Day Files/2026-01-14.md"];
  expect(index(reverse ? paths.reverse() : paths)).toEqual({ "2026-01-14": "Journal/2026-01-14.md" });
});
it("does not treat an unrelated subfolder note as an existing daily note", () => {
  expect(index(["Journal/Day Files/2026-01-14.md"])).toEqual({});
});
it("parses date components from folders as well as the filename", () => {
  expect(index(["Journal/2024/02/03.md", "Journal/2025/02/03.md", "Journal/archive/2024/02/03.md"], "Journal", "YYYY/MM/DD"))
    .toEqual({ "2024-02-03": "Journal/2024/02/03.md", "2025-02-03": "Journal/2025/02/03.md" });
});
it("handles the vault root and ignores non-Markdown files", () => {
  expect(index(["2026-01-14.md", "2026-01-14.png", "Other/2026-01-14.md"], ""))
    .toEqual({ "2026-01-14": "2026-01-14.md" });
});
it("normalizes folder separators and supports literal format text", () => {
  expect(index(["Journal/Daily/Day 2026-01-14.md"], "Journal/Daily/", "[Day] YYYY-MM-DD"))
    .toEqual({ "2026-01-14": "Journal/Daily/Day 2026-01-14.md" });
});
it("rejects invalid dates", () => {
  expect(index(["Journal/2026-02-30.md", "Journal/not-a-date.md"])).toEqual({});
});
it("reports a missing configured folder", () => {
  mockSettings = { folder: "missing", format: "YYYY-MM-DD" };
  Object.assign(window, { app: { vault: { getAbstractFileByPath: () => null } } });
  expect(() => getAllDailyNotes()).toThrow("Failed to find daily notes folder");
});
