import * as moment from "moment-timezone";

import getMockApp, { createFile, createFolder } from "src/testUtils/mockApp";

import * as dailyNotesInterface from "../index";
import * as vaultUtils from "../vault";
import { setDailyConfig, setPeriodicNotesConfig } from "../testUtils/utils";

describe("getDailyNoteSettings", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.existingFiles = {};
    window.moment = moment;
    moment.tz.setDefault("America/New_York");
  });

  test("returns all the daily note settings", () => {
    setDailyConfig({
      folder: "foo",
      format: "YYYY-MM-DD-HHmm",
      template: "template",
    });

    expect(dailyNotesInterface.getDailyNoteSettings()).toEqual({
      folder: "foo",
      format: "YYYY-MM-DD-HHmm",
      template: "template",
    });
  });

  test("cleanses data", () => {
    setDailyConfig({
      folder: " foo/bar ",
      format: "MMM YYYY-MM-DD",
      template: "   path/to/template  ",
    });

    expect(dailyNotesInterface.getDailyNoteSettings()).toEqual({
      folder: "foo/bar",
      format: "MMM YYYY-MM-DD",
      template: "path/to/template",
    });
  });

  test("returns defaults if daily note settings don't exist", () => {
    expect(dailyNotesInterface.getDailyNoteSettings()).toEqual({
      format: "YYYY-MM-DD",
      folder: "",
      template: "",
    });
  });

  test("uses settings from core daily notes if periodic-notes' `daily` is disabled", () => {
    setDailyConfig({
      folder: " foo ",
      format: "YYYY/MM/MMM/YYYY-MM-DD",
      template: "   path/to/daily  ",
    });

    setPeriodicNotesConfig("daily", {
      enabled: false,
      folder: " foo/bar ",
      format: "MMM YYYY-MM-DD",
      template: "   path/to/template  ",
    });

    expect(dailyNotesInterface.getDailyNoteSettings()).toEqual({
      folder: "foo",
      format: "YYYY/MM/MMM/YYYY-MM-DD",
      template: "path/to/daily",
    });
  });

  test("uses settings from Periodic Notes if periodic-notes and daily notes are both enabled", () => {
    setDailyConfig({
      folder: " foo/bar ",
      format: "YYYY/MM/MMM/YYYY-MM-DD",
      template: "   path/to/template  ",
    });

    setPeriodicNotesConfig("daily", {
      enabled: true,
      folder: " foo/bar ",
      format: "MMM YYYY-MM-DD",
      template: "   path/to/template  ",
    });

    expect(dailyNotesInterface.getDailyNoteSettings()).toEqual({
      format: "MMM YYYY-MM-DD",
      folder: "foo/bar",
      template: "path/to/template",
    });
  });
});

describe("appHasDailyNotesPluginLoaded", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.existingFiles = {};
    window.moment = moment;
  });

  test("returns true when daily notes plugin is enabled", () => {
    // eslint-disable-next-line
    (<any>window.app).internalPlugins.plugins["daily-notes"].enabled = true;

    expect(dailyNotesInterface.appHasDailyNotesPluginLoaded()).toEqual(true);
  });

  test("returns true when daily notes plugin is enabled", () => {
    // eslint-disable-next-line
    (<any>window.app).internalPlugins.plugins["daily-notes"].enabled = false;

    expect(dailyNotesInterface.appHasDailyNotesPluginLoaded()).toEqual(false);
  });
});

describe("getAllDailyNotes", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    window.existingFiles = {};
  });

  test("throws error if daily note folder can't be found", () => {
    setDailyConfig({
      folder: "missing-folder/",
      format: "YYYY-MM-DD",
      template: "template",
    });

    expect(dailyNotesInterface.getAllDailyNotes).toThrow(
      "Failed to find daily notes folder"
    );
  });

  test("returns a list of all daily notes with no nested folders", () => {
    setDailyConfig({
      folder: "/",
      format: "YYYY-MM-DD",
      template: "template",
    });

    const fileA = createFile("2020-12-01", "");
    const fileB = createFile("2020-12-02", "");
    const fileC = createFile("2020-12-03", "");
    createFolder("/", [fileA, fileB, fileC]);

    expect(dailyNotesInterface.getAllDailyNotes()).toEqual({
      "day-2020-12-01T00:00:00-05:00": fileA,
      "day-2020-12-02T00:00:00-05:00": fileB,
      "day-2020-12-03T00:00:00-05:00": fileC,
    });
  });

  test("returns a list of all daily notes including files nested in folders", () => {
    setDailyConfig({
      folder: "/",
      format: "YYYY-MM-DD",
      template: "template",
    });

    const fileA = createFile("2020-12-01", "");
    const fileB = createFile("2020-12-02", "");
    const fileC = createFile("2020-12-03", "");
    createFolder("/", [fileA, fileB, createFolder("foo", [fileC])]);

    expect(dailyNotesInterface.getAllDailyNotes()).toEqual({
      "day-2020-12-01T00:00:00-05:00": fileA,
      "day-2020-12-02T00:00:00-05:00": fileB,
      "day-2020-12-03T00:00:00-05:00": fileC,
    });
  });
});

describe("createDailyNote", () => {
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
{{yesterday}}
{{tomorrow}}
{{date:YYYY}}-{{date:MM-DD}}
{{date-1d:YYYY-MM-DD}}
{{date+2d:YYYY-MM-DD}}
{{date+1M:YYYY-MM-DD}}
{{date+10y:YYYY-MM-DD}}
{{date +7d}}
`,
      null,
    ]);

    setDailyConfig({
      folder: "/",
      format: "YYYY-MM-DD",
      template: "template",
    });

    await dailyNotesInterface.createDailyNote(window.moment());

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/2021-02-15.md",
      `
2021-02-15
14:06
2021-02-15
2021-02-14
2021-02-16
2021-02-15
2021-02-14
2021-02-17
2021-03-15
2031-02-15
2021-02-22
`
    );
  });
});
