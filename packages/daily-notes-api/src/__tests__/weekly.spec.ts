import * as moment from "moment-timezone";

import getMockApp, { createFile, createFolder } from "src/testUtils/mockApp";

import * as dailyNotesInterface from "../index";
import { getDayOfWeekNumericalValue } from "../weekly";
import * as vaultUtils from "../vault";
import { setWeeklyConfig } from "../testUtils/utils";

jest.mock("path");

describe("getDayOfWeekNumericalValue", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    moment.tz.setDefault("America/New_York");
  });

  describe("start week on Sunday", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>moment.localeData())._week.dow = 0;
    });

    test("returns 0 for sunday", () => {
      expect(getDayOfWeekNumericalValue("sunday")).toEqual(0);
    });

    test("returns 1 for monday", () => {
      expect(getDayOfWeekNumericalValue("monday")).toEqual(1);
    });
  });

  describe("start week on Monday", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>moment.localeData())._week.dow = 1;
    });

    test("returns 0 for sunday", () => {
      expect(getDayOfWeekNumericalValue("sunday")).toEqual(6);
    });

    test("returns 1 for monday", () => {
      expect(getDayOfWeekNumericalValue("monday")).toEqual(0);
    });
  });
});

describe("getWeeklyNoteSettings", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.existingFiles = {};
    window.moment = moment;
  });

  test("returns all the weekly note settings", () => {
    setWeeklyConfig({
      enabled: true,
      folder: "foo",
      format: "gggg-MM-DD",
      template: "template",
    });

    expect(dailyNotesInterface.getWeeklyNoteSettings()).toEqual({
      folder: "foo",
      format: "gggg-MM-DD",
      template: "template",
    });
  });

  test("cleanses data", () => {
    setWeeklyConfig({
      enabled: true,
      folder: " foo/bar ",
      format: "gggg-MM-DD",
      template: "   path/to/template  ",
    });

    expect(dailyNotesInterface.getWeeklyNoteSettings()).toEqual({
      folder: "foo/bar",
      format: "gggg-MM-DD",
      template: "path/to/template",
    });
  });

  test("returns defaults if weekly note settings don't exist", () => {
    expect(dailyNotesInterface.getWeeklyNoteSettings()).toEqual({
      format: "gggg-[W]ww",
      folder: "",
      template: "",
    });
  });
});

describe("appHasWeeklyNotesPluginLoaded", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.existingFiles = {};
    window.moment = moment;
  });

  test("returns true when weekly notes plugin is enabled", () => {
    // eslint-disable-next-line
    (<any>window.app).plugins.plugins["calendar"]._loaded = true;

    expect(dailyNotesInterface.appHasWeeklyNotesPluginLoaded()).toEqual(true);
  });

  test("returns false when weekly notes plugin is disabled", () => {
    // eslint-disable-next-line
    (<any>window.app).plugins.plugins["periodic-notes"]._loaded = false;
    // eslint-disable-next-line
    (<any>window.app).plugins.plugins["calendar"]._loaded = false;

    expect(dailyNotesInterface.appHasWeeklyNotesPluginLoaded()).toEqual(false);
  });
});

describe("getAllWeeklyNotes", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    window.existingFiles = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<any>moment.localeData())._week.dow = 0;
  });

  test("throws error if weekly note folder can't be found", () => {
    setWeeklyConfig({
      enabled: true,
      folder: "missing-folder/",
      format: "gggg-[W]ww",
      template: "template",
    });

    expect(dailyNotesInterface.getAllWeeklyNotes).toThrow(
      "Failed to find weekly notes folder"
    );
  });

  test("returns a list of all weekly notes with no nested folders", () => {
    setWeeklyConfig({
      enabled: true,
      folder: "/",
      format: "gggg-[W]ww",
      template: "template",
    });

    const fileA = createFile("2021-W02", "");
    const fileB = createFile("2021-W03", "");
    const fileC = createFile("2021-W04", "");
    createFolder("/", [fileA, fileB, fileC]);

    expect(dailyNotesInterface.getAllWeeklyNotes()).toEqual({
      "week-2021-01-03T00:00:00-05:00": fileA,
      "week-2021-01-10T00:00:00-05:00": fileB,
      "week-2021-01-17T00:00:00-05:00": fileC,
    });
  });

  test("returns a list of all weekly notes including files nested in folders", () => {
    setWeeklyConfig({
      enabled: true,
      folder: "/",
      format: "gggg-[W]ww",
      template: "template",
    });

    const fileA = createFile("2021-W02", "");
    const fileB = createFile("2021-W03", "");
    const fileC = createFile("2021-W04", "");
    createFolder("/", [fileA, fileB, createFolder("foo", [fileC])]);

    expect(dailyNotesInterface.getAllWeeklyNotes()).toEqual({
      "week-2021-01-03T00:00:00-05:00": fileA,
      "week-2021-01-10T00:00:00-05:00": fileB,
      "week-2021-01-17T00:00:00-05:00": fileC,
    });
  });
});

describe("getWeeklyNote", () => {
  beforeEach(() => {
    window.existingFiles = {};
  });

  test("returns note on the same day even if the HH:MM:SS is different", () => {
    setWeeklyConfig({
      enabled: true,
      folder: "/",
      format: "gggg-[W]ww-HHmm",
      template: "template",
    });

    const fileA = createFile("2020-W02-0408", "");

    expect(
      dailyNotesInterface.getWeeklyNote(
        moment("2021-W02-0745", "gggg-[W]ww-HHmm", true),
        {
          "week-2021-01-03T00:00:00-05:00": fileA,
        }
      )
    ).toEqual(fileA);
  });

  test("returns null if there is no weekly note for a given date", () => {
    setWeeklyConfig({
      enabled: true,
      folder: "/",
      format: "gggg-ww",
      template: "template",
    });

    const fileA = createFile("2020-01", "");

    expect(
      dailyNotesInterface.getWeeklyNote(moment("2020-01", "gggg-ww", true), {
        "2020-12-03": fileA,
      })
    ).toEqual(null);
  });
});

describe("createWeeklyNote", () => {
  beforeEach(() => {
    window.existingFiles = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<any>moment.localeData())._week.dow = 1;
  });

  test("uses folder path from weekly note settings", async () => {
    setWeeklyConfig({
      enabled: true,
      folder: "/weekly-notes",
      format: "gggg-MM-DD",
    });

    const date = moment({ day: 5, month: 10, year: 2020 });
    await dailyNotesInterface.createWeeklyNote(date);

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/weekly-notes/2020-11-05.md",
      ""
    );
  });

  test("uses template contents when creating file", async () => {
    setWeeklyConfig({
      enabled: true,
      folder: "/weekly-notes",
      format: "gggg-MM-DD",
      template: "template",
    });

    createFile("template", "template contents");

    const date = moment({ day: 5, month: 10, year: 2020 });
    await dailyNotesInterface.createWeeklyNote(date);

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/weekly-notes/2020-11-05.md",
      "template contents"
    );
  });

  test("replaces {{sunday}} and {{monday}} in weekly note", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<any>moment.localeData())._week.dow = 0;

    setWeeklyConfig({
      enabled: true,
      folder: "/weekly-notes",
      format: "gggg-[W]ww",
      template: "template",
    });

    createFile(
      "template",
      "# {{sunday:gggg-MM-DD}}, {{monday:gggg-MM-DD}}, etc"
    );

    const date = moment({ day: 5, month: 0, year: 2021 });

    await dailyNotesInterface.createWeeklyNote(date);

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/weekly-notes/2021-W02.md",
      "# 2021-01-03, 2021-01-04, etc"
    );
  });

  test("shows error if file creation failed", async () => {
    const createFn = window.app.vault.create;
    (createFn as jest.MockedFunction<typeof createFn>).mockRejectedValue(
      "error"
    );
    jest.spyOn(global.console, "error").mockImplementation();

    setWeeklyConfig({
      enabled: true,
      folder: "/weekly-notes",
      format: "gggg-[W]ww",
    });
    const date = moment({ day: 5, month: 10, year: 2020 });

    await dailyNotesInterface.createWeeklyNote(date);

    expect(console.error).toHaveBeenCalledWith(
      "Failed to create file: '/weekly-notes/2020-W45.md'",
      "error"
    );
  });
});

describe("createWeeklyNote", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment.bind(null, "2021-02-15T14:06:00-05:00");
    moment.tz.setDefault("America/New_York");
  });

  test("replaces all mustaches in template", async () => {
    const getTemplateInfo = jest.spyOn(vaultUtils, "getTemplateInfo");
    getTemplateInfo.mockResolvedValue([
      `
{{date}}
{{time}}
{{title}}
{{date:gggg}} {{date:[W]ww}}
{{date-1w:gggg-[W]ww-DD}}
{{date+2d:gggg-[W]ww-DD}}
{{date+1M:gggg-[W]ww-DD}}
{{date+10y:gggg-[W]ww-DD}}
{{date +7d}}
`,
      null,
    ]);

    setWeeklyConfig({
      enabled: true,
      folder: "/",
      format: "gggg-[W]ww",
      template: "template",
    });

    await dailyNotesInterface.createDailyNote(window.moment());

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/2021-02-15.md",
      `
2021-02-15
14:06
2021-02-15
2021 W08
2021-W07-08
2021-W08-17
2021-W12-15
2031-W07-15
2021-02-22
`
    );
  });
});
