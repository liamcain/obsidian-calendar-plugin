import type { Moment } from "moment";
import { Setting, TFile } from "obsidian";
import type {
  ICalendarSource,
  IDayMetadata,
  ISourceSettings,
} from "obsidian-calendar-ui";
import { getDailyNote, getWeeklyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { dailyNotes, weeklyNotes } from "../stores";

interface ITasksSettings extends ISourceSettings {
  maxIncompleteTaskDots: number;
}

export async function getNumberOfTasks(note: TFile): Promise<[number, number]> {
  if (!note) {
    return [0, 0];
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(note);

  return [
    (fileContents.match(/(-|\*) \[ \] /g) || []).length,
    (fileContents.match(/(-|\*) \[x\] /gi) || []).length,
  ];
}

async function getMetadata(file: TFile): Promise<IDayMetadata> {
  const [numRemainingTasks, numCompletedTasks] = await getNumberOfTasks(file);
  const totalTasks = numRemainingTasks + numCompletedTasks;
  const color = "#BF616A";

  return {
    color,
    name: "Tasks",
    value: numCompletedTasks,
    goal: totalTasks,
    isShowcased: true,
    toDots: () => {
      if (numRemainingTasks) {
        return [
          {
            color,
            isFilled: false,
          },
        ];
      }
      return [];
    },
  };
}

export const tasksSource: ICalendarSource = {
  id: "tasks",
  name: "Tasks",

  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return getMetadata(file);
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));
    return getMetadata(file);
  },

  registerSettings: (
    containerEl: HTMLElement,
    sourceSettings: ITasksSettings,
    saveSettings: (settings: Partial<ITasksSettings>) => void
  ) => {
    new Setting(containerEl)
      .setName("Max incomplete tasks shown")
      .setDesc("Limit the number of dots shown for incomplete tasks")
      .addSlider((slider) =>
        slider
          .setLimits(1, 6, 1)
          .setDynamicTooltip()
          .setValue(sourceSettings.maxIncompleteTaskDots || 1)
          .onChange((maxIncompleteTaskDots) => {
            saveSettings({ maxIncompleteTaskDots });
          })
      );
  },
};
