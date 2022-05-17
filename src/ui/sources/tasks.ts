import type { Moment } from "moment";
import { App, Setting, TFile } from "obsidian";
import type {
  Granularity,
  ICalendarSource,
  IEvaluatedMetadata,
  ISourceSettings,
} from "obsidian-calendar-ui";
import CalendarPlugin from "src/main";
import { get } from "svelte/store";

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

export class TasksSource implements ICalendarSource {
  public id: string = TASK_SOURCE_ID;
  public name: string = "Tasks";
  public description: string = "Track your pending tasks for any given day";

  constructor(readonly app: App, readonly plugin: CalendarPlugin) {}

  public async getMetadata(
    granularity: Granularity,
    date: Moment
  ): Promise<IEvaluatedMetadata> {
    const periodicNotes = this.app.plugins.getPlugin("periodic-notes");
    const exactMatch = periodicNotes.getPeriodicNote(granularity, date);

    let totalTasks = 0;
    let numCompletedTasks = 0;
    let numDots = 0;
    if (exactMatch) {
      const [numRemainingTasks, numCompletedTasks] = await getNumberOfTasks(exactMatch);
      totalTasks = numRemainingTasks + numCompletedTasks;

      const sourceSettings = get(this.plugin.settings).sourceSettings[
        TASK_SOURCE_ID
      ] as ITasksSettings;
      const maxDots = sourceSettings?.maxIncompleteTaskDots || 1;
      numDots = Math.min(numRemainingTasks, maxDots);
    }

    return {
      dots: emptyDots(numDots),
      value: numCompletedTasks,
      goal: totalTasks,
    };
  }

  public defaultSettings = Object.freeze({
    color: "var(--background-modifier-success)",
    enabled: true,
    maxIncompleteTaskDots: 1,
  });

  public registerSettings(
    containerEl: HTMLElement,
    sourceSettings: ITasksSettings,
    saveSettings: (settings: Partial<ITasksSettings>) => void
  ) {
    new Setting(containerEl)
      .setName("Max incomplete tasks shown")
      .setDesc("Limit the number of dots shown for incomplete tasks")
      .addSlider((slider) =>
        slider
          .setLimits(1, 5, 1)
          .setDynamicTooltip()
          .setValue(sourceSettings?.maxIncompleteTaskDots || 1)
          .onChange((maxIncompleteTaskDots) => {
            saveSettings({ maxIncompleteTaskDots });
          })
      );
  }
}
