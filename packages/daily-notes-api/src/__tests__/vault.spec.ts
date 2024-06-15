import * as moment from "moment";

import * as dailyNotesInterface from "../index";
import { join } from "../vault";

import getMockApp, { createFile } from "src/testUtils/mockApp";

describe("join function", () => {
  test("join() mimics path.join", () => {
    expect(join("test", "/foo", "/bar/", "baz.md")).toEqual(
      "test/foo/bar/baz.md"
    );
    expect(join("/test", "baz.md")).toEqual("/test/baz.md");
    expect(join("/test.md")).toEqual("/test.md");
  });
});

describe("getTemplateInfo", () => {
  beforeEach(() => {
    window.app = getMockApp();
    window.moment = moment;
    window.existingFiles = {};

    createFile("fileA", "A. Lorem ipsum dolor sit amet");
    createFile("fileB", "B. Lorem ipsum dolor sit amet");
    createFile("fileC", "C. Lorem ipsum dolor sit amet");
  });

  test("returns '' if path is empty", async () => {
    const [templateContents] = await dailyNotesInterface.getTemplateInfo("");
    expect(templateContents).toEqual("");
  });

  test("returns contents of the template file", async () => {
    const [templateContents] = await dailyNotesInterface.getTemplateInfo(
      "fileA"
    );
    expect(templateContents).toEqual("A. Lorem ipsum dolor sit amet");
  });

  test("throws error if file can't be found", async () => {
    jest.spyOn(global.console, "error").mockImplementation();

    const [templateContents] = await dailyNotesInterface.getTemplateInfo(
      "nonexistent-file"
    );

    expect(console.error).toHaveBeenCalledWith(
      "Failed to read the daily note template '/nonexistent-file'",
      "error"
    );
    expect(templateContents).toEqual("");
  });
});
