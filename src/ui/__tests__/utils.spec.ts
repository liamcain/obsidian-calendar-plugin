import moment from "moment";

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
      const monthData = getMonthData(
        null,
        moment({ year: 2020, month: 0, day: 1 }),
        getDefaultSettings({ shouldStartWeekOnMonday: false })
      );

      expect(
        monthData.map((week) => week.days.map((day) => day.dayOfMonth))
      ).toEqual([
        [undefined, undefined, undefined, 1, 2, 3, 4],
        [5, 6, 7, 8, 9, 10, 11],
        [12, 13, 14, 15, 16, 17, 18],
        [19, 20, 21, 22, 23, 24, 25],
        [26, 27, 28, 29, 30, 31, undefined],
      ]);
    });

    it("creates correct calendar starting on Monday", () => {
      const monthData = getMonthData(
        null,
        moment({ year: 2020, month: 0, day: 1 }),
        getDefaultSettings({ shouldStartWeekOnMonday: true })
      );

      expect(
        monthData.map((week) => week.days.map((day) => day.dayOfMonth))
      ).toEqual([
        [undefined, undefined, 1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26],
        [27, 28, 29, 30, 31, undefined, undefined],
      ]);
    });
  });

  describe("february", () => {
    it("creates correct calendar starting on Sunday", () => {
      const monthData = getMonthData(
        null,
        moment({ year: 2020, month: 1, day: 1 }),
        getDefaultSettings({ shouldStartWeekOnMonday: false })
      );

      expect(
        monthData.map((week) => week.days.map((day) => day.dayOfMonth))
      ).toEqual([
        [undefined, undefined, undefined, undefined, undefined, undefined, 1],
        [2, 3, 4, 5, 6, 7, 8],
        [9, 10, 11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20, 21, 22],
        [23, 24, 25, 26, 27, 28, 29],
      ]);
    });

    it("creates correct calendar starting on Monday", () => {
      const monthData = getMonthData(
        null,
        moment({ year: 2020, month: 1, day: 1 }),
        getDefaultSettings({ shouldStartWeekOnMonday: true })
      );

      expect(
        monthData.map((week) => week.days.map((day) => day.dayOfMonth))
      ).toEqual([
        [undefined, undefined, undefined, undefined, undefined, 1, 2],
        [3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16],
        [17, 18, 19, 20, 21, 22, 23],
        [24, 25, 26, 27, 28, 29, undefined],
      ]);
    });
  });
});
