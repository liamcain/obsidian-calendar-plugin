import moment from "moment";

import { settings } from "../../ui/stores";
import { getDefaultSettings } from "../../testUtils/settings";
import mockApp from "../../testUtils/mockApp";
import { getMonthData } from "../utils";

jest.mock("obsidian");

describe("getMonthData", () => {
  beforeEach(() => {
    window.app = mockApp;
    window.moment = moment;
  });

  describe("january", () => {
    it("creates correct calendar starting on Sunday", () => {
      settings.set(getDefaultSettings({ weekStart: "sunday" }));
      const monthData = getMonthData(moment({ year: 2020, month: 0, day: 1 }));

      expect(
        monthData.map((week) => week.days.map((day) => day.date()))
      ).toEqual([
        [29, 30, 31, 1, 2, 3, 4],
        [5, 6, 7, 8, 9, 10, 11],
        [12, 13, 14, 15, 16, 17, 18],
        [19, 20, 21, 22, 23, 24, 25],
        [26, 27, 28, 29, 30, 31, 1],
        [2, 3, 4, 5, 6, 7, 8],
      ]);
    });

    it("creates correct calendar starting on Monday", () => {
      settings.set(getDefaultSettings({ weekStart: "monday" }));
      const monthData = getMonthData(moment({ year: 2020, month: 0, day: 1 }));

      expect(
        monthData.map((week) => week.days.map((day) => day.date()))
      ).toEqual([
        [30, 31, 1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26],
        [27, 28, 29, 30, 31, 1, 2],
        [3, 4, 5, 6, 7, 8, 9],
      ]);
    });
  });

  describe("february", () => {
    it("creates correct calendar starting on Sunday", () => {
      settings.set(getDefaultSettings({ weekStart: "sunday" }));
      const monthData = getMonthData(moment({ year: 2020, month: 1, day: 1 }));

      expect(
        monthData.map((week) => week.days.map((day) => day.date()))
      ).toEqual([
        [26, 27, 28, 29, 30, 31, 1],
        [2, 3, 4, 5, 6, 7, 8],
        [9, 10, 11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20, 21, 22],
        [23, 24, 25, 26, 27, 28, 29],
        [1, 2, 3, 4, 5, 6, 7],
      ]);
    });

    it("creates correct calendar starting on Monday", () => {
      settings.set(getDefaultSettings({ weekStart: "monday" }));
      const monthData = getMonthData(moment({ year: 2020, month: 1, day: 1 }));

      expect(
        monthData.map((week) => week.days.map((day) => day.date()))
      ).toEqual([
        [27, 28, 29, 30, 31, 1, 2],
        [3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16],
        [17, 18, 19, 20, 21, 22, 23],
        [24, 25, 26, 27, 28, 29, 1],
        [2, 3, 4, 5, 6, 7, 8],
      ]);
    });
  });
});
