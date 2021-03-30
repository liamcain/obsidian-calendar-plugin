import type { Moment } from "moment";
import { Setting, TFile } from "obsidian";
import type {
  ICalendarSource,
  IEvaluatedMetadata,
  ISourceSettings,
} from "obsidian-calendar-ui";
import { getDailyNote, getWeeklyNote } from "obsidian-daily-notes-interface";
import { get } from "svelte/store";

import { dailyNotes, settings, weeklyNotes } from "../stores";
import { emptyDots } from "./utils";

const TASK_SOURCE_ID = "tasks";

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

async function getMetadata(file: TFile): Promise<IEvaluatedMetadata> {
  const [numRemainingTasks, numCompletedTasks] = await getNumberOfTasks(file);
  const totalTasks = numRemainingTasks + numCompletedTasks;

  const sourceSettings = get(settings).sourceSettings[
    TASK_SOURCE_ID
  ] as ITasksSettings;
  const maxDots = sourceSettings?.maxIncompleteTaskDots || 1;
  const numDots = Math.min(numRemainingTasks, maxDots);

  return {
    dots: emptyDots(numDots),
    value: numCompletedTasks,
    goal: totalTasks,
  };
}

export const tasksSource: ICalendarSource = {
  id: TASK_SOURCE_ID,
  name: "Tasks",
  description: "Track your pending tasks for any given day",

  getDailyMetadata: async (date: Moment): Promise<IEvaluatedMetadata> => {
    const file = getDailyNote(date, get(dailyNotes));
    return getMetadata(file);
  },

  getWeeklyMetadata: async (date: Moment): Promise<IEvaluatedMetadata> => {
    const file = getWeeklyNote(date, get(weeklyNotes));
    return getMetadata(file);
  },

  defaultSettings: Object.freeze({
    color: "#d08770",
    display: "calendar-and-menu",
    maxIncompleteTaskDots: 1,
  }),
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
          .setValue(sourceSettings?.maxIncompleteTaskDots || 1)
          .onChange((maxIncompleteTaskDots) => {
            saveSettings({ maxIncompleteTaskDots });
          })
      );
  },
};
