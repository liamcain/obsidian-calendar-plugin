import { findMonthlyDayRange } from "./monthlyNotes";

describe("findMonthlyDayRange", () => {
  const content = [
    "# 2026-09", "## 01", "September event", "# 2026-10", "## 1",
    "", "- First event", "- Second event", "## 02", "Next day",
  ].join("\n");

  it("finds the requested month and accepts unpadded day headings", () => {
    expect(findMonthlyDayRange(content, "2026-10", "01")).toEqual({ start: 5, end: 8 });
    expect(findMonthlyDayRange(content, "2026-09", "1")).toEqual({ start: 2, end: 3 });
  });

  it("includes the last day through the end of the file", () => {
    expect(findMonthlyDayRange(content, "2026-10", "02")).toEqual({ start: 9, end: 10 });
  });

  it("does not navigate to another month or a missing day", () => {
    expect(findMonthlyDayRange(content, "2026-11", "01")).toBeNull();
    expect(findMonthlyDayRange(content, "2026-10", "03")).toBeNull();
  });

  it("stops at unrelated headings and handles CRLF", () => {
    expect(findMonthlyDayRange("# 2026-10\r\n## 01\r\nEvent\r\n## Notes\r\nOther", "2026-10", "01"))
      .toEqual({ start: 2, end: 3 });
  });
});
