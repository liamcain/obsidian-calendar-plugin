import moment from "moment";

import { parseDailyNoteDateFromBasename } from "./dailyNoteFilenames";

describe("parseDailyNoteDateFromBasename", () => {
  beforeAll(() => {
    Object.assign(window, { moment });
  });

  it("parses exact daily note filenames", () => {
    const date = parseDailyNoteDateFromBasename(
      "2026-05-17",
      "YYYY-MM-DD",
      false
    );

    expect(date?.format("YYYY-MM-DD")).toBe("2026-05-17");
  });

  it("rejects title suffixes when disabled", () => {
    const date = parseDailyNoteDateFromBasename(
      "2026-05-17 Sunday reflection",
      "YYYY-MM-DD",
      false
    );

    expect(date).toBeNull();
  });

  it("parses title suffixes when enabled", () => {
    const date = parseDailyNoteDateFromBasename(
      "2026-05-17 Sunday reflection",
      "YYYY-MM-DD",
      true
    );

    expect(date?.format("YYYY-MM-DD")).toBe("2026-05-17");
  });

  it("parses suffixes after escaped literal date formats", () => {
    const date = parseDailyNoteDateFromBasename(
      "Daily 2026-05-17 Sunday reflection",
      "[Daily] YYYY-MM-DD",
      true
    );

    expect(date?.format("YYYY-MM-DD")).toBe("2026-05-17");
  });

  it("rejects adjacent characters that are not title separators", () => {
    const date = parseDailyNoteDateFromBasename(
      "2026-05-171",
      "YYYY-MM-DD",
      true
    );

    expect(date).toBeNull();
  });
});
