import moment from "moment";
import { getTemplateContents } from "obsidian-daily-notes-interface";

import { getDefaultSettings } from "src/testUtils/settings";
import mockApp from "src/testUtils/mockApp";

import * as weeklyNote from "../weeklyNotes";

jest.mock("obsidian-daily-notes-interface", () => ({
  getTemplateContents: jest.fn(),
}));

describe("getDayOfWeekNumericalValue", () => {
  beforeEach(() => {
    window.app = mockApp;
    window.moment = moment;
  });

  describe("start week on Sunday", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>moment.localeData())._week.dow = 0;
    });

    test("returns 0 for sunday", () => {
      expect(weeklyNote.getDayOfWeekNumericalValue("sunday")).toEqual(0);
    });

    test("returns 1 for monday", () => {
      expect(weeklyNote.getDayOfWeekNumericalValue("monday")).toEqual(1);
    });
  });

  describe("start week on Monday", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>moment.localeData())._week.dow = 1;
    });

    test("returns 0 for sunday", () => {
      expect(weeklyNote.getDayOfWeekNumericalValue("sunday")).toEqual(6);
    });

    test("returns 1 for monday", () => {
      expect(weeklyNote.getDayOfWeekNumericalValue("monday")).toEqual(0);
    });
  });
});

describe("createWeeklyNote", () => {
  beforeEach(() => {
    window.app = mockApp;
    window.moment = moment;
  });

  test("creates note without template", async () => {
    (getTemplateContents as jest.MockedFunction<
      typeof getTemplateContents
    >).mockResolvedValue("foo");

    await weeklyNote.createWeeklyNote(
      moment({ day: 1, month: 0, year: 2020 }),
      getDefaultSettings()
    );

    expect(window.app.vault.create).toHaveBeenCalledWith("", "foo");
  });

  test("replaces {{time}} and {{date}} in weekly note", async () => {
    (getTemplateContents as jest.MockedFunction<
      typeof getTemplateContents
    >).mockResolvedValue("# {{date:gggg-MM}}\ncontents");

    await weeklyNote.createWeeklyNote(
      moment({ day: 1, month: 0, year: 2020 }),
      getDefaultSettings()
    );

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "",
      "# 2020-01\ncontents"
    );
  });

  describe("start week on Sunday", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>moment.localeData())._week.dow = 0;
    });

    test("replaces {{sunday}} and {{monday}} in weekly note", async () => {
      (getTemplateContents as jest.MockedFunction<
        typeof getTemplateContents
      >).mockResolvedValue(
        "# {{sunday:gggg-MM-DD}}, {{monday:gggg-MM-DD}}, etc"
      );

      await weeklyNote.createWeeklyNote(
        moment({ day: 22, month: 10, year: 2020 }),
        getDefaultSettings()
      );

      expect(window.app.vault.create).toHaveBeenCalledWith(
        "",
        "# 2020-11-22, 2020-11-23, etc"
      );
    });
  });

  describe("start week on Monday", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>moment.localeData())._week.dow = 1;
    });

    test("replaces {{sunday}} and {{monday}} in weekly note", async () => {
      (getTemplateContents as jest.MockedFunction<
        typeof getTemplateContents
      >).mockResolvedValue(
        "# From {{monday:gggg-MM-DD}} to {{sunday:gggg-MM-DD}}"
      );

      await weeklyNote.createWeeklyNote(
        moment({ day: 22, month: 10, year: 2020 }),
        getDefaultSettings({ weekStart: "monday" })
      );

      expect(window.app.vault.create).toHaveBeenCalledWith(
        "",
        "# From 2020-11-16 to 2020-11-22"
      );
    });
  });
});
