import type { Moment } from "moment";
import { App, Menu, TFile } from "obsidian";
import type { Granularity } from "obsidian-calendar-ui";

function getPeriodicity(granularity: Granularity) {
  switch (granularity) {
    case "day":
      return "daily";
    default:
      return `${granularity}ly`;
  }
}

export function showFileMenu(
  event: MouseEvent,
  app: App,
  granularity: Granularity,
  date: Moment,
  file: TFile | null
): void {
  const fileMenu = new Menu(app);
  if (file) {
    fileMenu.addItem((item) =>
      item
        .setTitle("Delete")
        .setIcon("trash")
        .onClick(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (<any>app).fileManager.promptForFileDeletion(file);
        })
    );
  } else {
    fileMenu.addItem((item) =>
      item
        .setTitle(`Create ${getPeriodicity(granularity)} note`)
        .setIcon("plus")
        .onClick(() => {
          const periodicNotes = app.plugins.getPlugin("periodic-notes");
          periodicNotes.openPeriodicNote(granularity, date);
        })
    );
  }

  fileMenu.addItem((item) =>
    item
      .setTitle("Show related...")
      .setIcon("forward-arrow")
      .onClick(() => {
        const periodicNotes = app.plugins.getPlugin("periodic-notes");
        periodicNotes.showRelatedNotes(granularity, date);
      })
  );

  if (file) {
    // only show file-related actions if there is a file for that date
    app.workspace.trigger("file-menu", fileMenu, file, "calendar-context-menu", null);
  }

  fileMenu.showAtMouseEvent(event);
}
