import { getNoteCountAsDots } from "./noteCount";

jest.mock("svelte/store", () => ({
  get: jest.fn(),
}));

jest.mock("obsidian-daily-notes-interface", () => ({
  getWeeklyNote: jest.fn(),
}));

jest.mock("src/io/dailyNoteIndex", () => ({
  getDailyNotesForDate: jest.fn(),
}));

jest.mock("../stores", () => ({
  dailyNotes: {},
  dailyNotesByDate: {},
  weeklyNotes: {},
}));

describe("noteCountSource", () => {
  it("creates one filled dot per note", () => {
    expect(getNoteCountAsDots(3)).toEqual([
      { color: "default", isFilled: true },
      { color: "default", isFilled: true },
      { color: "default", isFilled: true },
    ]);
  });

  it("does not create dots for zero notes", () => {
    expect(getNoteCountAsDots(0)).toEqual([]);
  });

  it("limits note count dots to five", () => {
    expect(getNoteCountAsDots(8)).toHaveLength(5);
  });
});
