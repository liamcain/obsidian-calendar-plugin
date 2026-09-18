import type { Moment } from "moment";
import { App, Menu, Point, TFile } from "obsidian";

import { openEventModal } from "./eventModal";
import { setSelectedDate } from "./stores";

export function showDayMenu(
  app: App,
  date: Moment,
  file: TFile | null,
  position: Point
): void {
  const menu = new Menu(app);
  const dateStr = date.format("YYYY-MM-DD");

  menu.addItem((item) =>
    item
      .setTitle("Adicionar evento")
      .setIcon("calendar-plus")
      .onClick(() => {
        setSelectedDate(dateStr);
        openEventModal(app, dateStr);
      })
  );

  menu.addSeparator();

  if (file) {
    menu.addItem((item) =>
      item
        .setTitle("Abrir nota diária")
        .setIcon("file-text")
        .onClick(async () => {
          const { workspace } = app;
          const leaf = workspace.getUnpinnedLeaf();
          await leaf.openFile(file, { active: true });
        })
    );
    menu.addItem((item) =>
      item
        .setTitle("Deletar nota")
        .setIcon("trash")
        .onClick(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (<any>app).fileManager.promptForFileDeletion(file);
        })
    );
    app.workspace.trigger("file-menu", menu, file, "calendar-context-menu", null);
  }

  menu.showAtPosition(position);
}

export function showFileMenu(app: App, file: TFile, position: Point): void {
  const fileMenu = new Menu(app);
  fileMenu.addItem((item) =>
    item
      .setTitle("Delete")
      .setIcon("trash")
      .onClick(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>app).fileManager.promptForFileDeletion(file);
      })
  );

  app.workspace.trigger(
    "file-menu",
    fileMenu,
    file,
    "calendar-context-menu",
    null
  );
  fileMenu.showAtPosition(position);
}
