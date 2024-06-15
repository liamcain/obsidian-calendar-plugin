import * as moment from "moment-timezone";

import getMockApp, { createFile, createFolder } from "src/testUtils/mockApp";

import * as dailyNotesInterface from "../index";
import { setMonthlyConfig } from "../testUtils/utils";

jest.mock("path");

moment.tz.setDefault("America/New_York");

describe("getMonthlyNoteSettings", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.existingFiles = {};
    window.moment = moment;
  });

  test("returns all the monthly note settings", () => {
    setMonthlyConfig({
      enabled: true,
      folder: "foo",
      format: "YYYY-MM",
      template: "template",
    });

    expect(dailyNotesInterface.getMonthlyNoteSettings()).toEqual({
      folder: "foo",
      format: "YYYY-MM",
      template: "template",
    });
  });

  test("cleanses data", () => {
    setMonthlyConfig({
      enabled: true,
      folder: " foo/bar ",
      format: "YYYY-MM",
      template: "   path/to/template  ",
    });

    expect(dailyNotesInterface.getMonthlyNoteSettings()).toEqual({
      folder: "foo/bar",
      format: "YYYY-MM",
      template: "path/to/template",
    });
  });

  test("returns defaults if monthly note settings don't exist", () => {
    expect(dailyNotesInterface.getMonthlyNoteSettings()).toEqual({
      format: "YYYY-MM",
      folder: "",
      template: "",
    });
  });
});

describe("appHasMonthlyNotesPluginLoaded", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.existingFiles = {};
    window.moment = moment;
  });

  test("returns true when periodic-notes plugin is enabled", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = (<any>window.app).plugins.plugins["periodic-notes"];
    periodicNotes._loaded = true;
    periodicNotes.settings.monthly.enabled = true;

    expect(dailyNotesInterface.appHasMonthlyNotesPluginLoaded()).toEqual(true);
  });

  test("returns false when periodic-notes plugin is enabled and weekly is disabled", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = (<any>window.app).plugins.plugins["periodic-notes"];

    periodicNotes._loaded = true;
    periodicNotes.settings.monthly.enabled = false;

    expect(dailyNotesInterface.appHasMonthlyNotesPluginLoaded()).toEqual(false);
  });

  test("returns false when periodic-notes plugin is disabled", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotes = (<any>window.app).plugins.plugins["periodic-notes"];

    periodicNotes._loaded = false;
    periodicNotes.settings.monthly.enabled = false;

    expect(dailyNotesInterface.appHasMonthlyNotesPluginLoaded()).toEqual(false);
  });
});

describe("getAllMonthlyNotes", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    window.existingFiles = {};
  });

  test("throws error if monthly note folder can't be found", () => {
    setMonthlyConfig({
      enabled: true,
      folder: "missing-folder/",
      format: "YYYY-MM",
      template: "template",
    });

    expect(dailyNotesInterface.getAllMonthlyNotes).toThrow(
      "Failed to find monthly notes folder"
    );
  });

  test("returns a list of all monthly notes with no nested folders", () => {
    setMonthlyConfig({
      enabled: true,
      folder: "/",
      format: "YYYY-MM",
      template: "template",
    });

    const fileA = createFile("2021-01", "");
    const fileB = createFile("2021-02", "");
    const fileC = createFile("2021-03", "");
    createFolder("/", [fileA, fileB, fileC]);

    expect(dailyNotesInterface.getAllMonthlyNotes()).toEqual({
      "month-2021-01-01T00:00:00-05:00": fileA,
      "month-2021-02-01T00:00:00-05:00": fileB,
      "month-2021-03-01T00:00:00-05:00": fileC,
    });
  });

  test("returns a list of all monthly notes including files nested in folders", () => {
    setMonthlyConfig({
      enabled: true,
      folder: "/",
      format: "YYYY-MM",
      template: "template",
    });

    const fileA = createFile("2021-01", "");
    const fileB = createFile("2021-02", "");
    const fileC = createFile("2021-03", "");
    createFolder("/", [fileA, fileB, createFolder("foo", [fileC])]);

    expect(dailyNotesInterface.getAllMonthlyNotes()).toEqual({
      "month-2021-01-01T00:00:00-05:00": fileA,
      "month-2021-02-01T00:00:00-05:00": fileB,
      "month-2021-03-01T00:00:00-05:00": fileC,
    });
  });
});

describe("getMonthlyNote", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    window.existingFiles = {};
  });

  test("returns note on the same day even if the HH:MM:SS is different", () => {
    setMonthlyConfig({
      enabled: true,
      folder: "/",
      format: "YYYY-MM-HHmm",
      template: "template",
    });

    const fileA = createFile("2020-02-0408", "");

    expect(
      dailyNotesInterface.getMonthlyNote(
        moment("2021-02-0745", "YYYY-MM-HHmm", true),
        {
          "month-2021-02-01T00:00:00-05:00": fileA,
        }
      )
    ).toEqual(fileA);
  });

  test("returns null if there is no monthly note for a given date", () => {
    setMonthlyConfig({
      enabled: true,
      folder: "/",
      format: "YYYY-ww",
    });

    const fileA = createFile("2020-01", "");

    expect(
      dailyNotesInterface.getMonthlyNote(moment("2020-01", "YYYY-ww", true), {
        "2020-12": fileA,
      })
    ).toEqual(null);
  });
});

describe("createMonthlyNote", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    window.existingFiles = {};
  });

  test("uses folder path from monthly note settings", async () => {
    setMonthlyConfig({
      enabled: true,
      folder: "/monthly-notes",
      format: "YYYY-MM",
    });

    const date = moment("2020-10", "YYYY-MM", true);
    await dailyNotesInterface.createMonthlyNote(date);

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/monthly-notes/2020-10.md",
      ""
    );
  });

  test("uses template contents when creating file", async () => {
    setMonthlyConfig({
      enabled: true,
      folder: "/monthly-notes",
      format: "YYYY-MM",
      template: "template",
    });

    createFile("template", "template contents");

    const date = moment("2020-10", "YYYY-MM", true);
    await dailyNotesInterface.createMonthlyNote(date);

    expect(window.app.vault.create).toHaveBeenCalledWith(
      "/monthly-notes/2020-10.md",
      "template contents"
    );
  });

  test("shows error if file creation failed", async () => {
    const createFn = window.app.vault.create;
    (createFn as jest.MockedFunction<typeof createFn>).mockRejectedValue(
      "error"
    );
    jest.spyOn(global.console, "error").mockImplementation();

    setMonthlyConfig({
      enabled: true,
      folder: "/monthly-notes",
      format: "YYYY-MM",
      template: "template",
    });
    const date = moment("2020-10", "YYYY-MM", true);

    await dailyNotesInterface.createMonthlyNote(date);

    expect(console.error).toHaveBeenCalledWith(
      "Failed to create file: '/monthly-notes/2020-10.md'",
      "error"
    );
  });
});
