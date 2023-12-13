import { App, Menu, Point, TFile } from "obsidian";

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
  fileMenu.addItem((item) =>
    item
      .setTitle("Open in new tab")
      .setIcon("file-plus")
      .setSection("open")
      .onClick(() => {
        app.workspace.openLinkText(file.path, "", true);
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
