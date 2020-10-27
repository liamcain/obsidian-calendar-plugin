import { FileSystemAdapter, View, TFile, WorkspaceLeaf } from "obsidian";
import * as fs from "fs";
import * as path from "path";

import Calendar from "./Calendar.svelte";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { createFileFromTemplate } from "./template";
import { modal } from "./ui";

export default class CalendarView extends View {
  //
  dailyNoteDirectory: string;
  dailyNoteTemplate: string;
  dateFormat: string;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.dailyNoteDirectory = "";
    this.dateFormat = "YYYY-MM-DD";
    this.dailyNoteTemplate = "";

    this.loadDailyNoteSettings();

    this._openFileByName = this._openFileByName.bind(this);
    this._createDailyNote = this._createDailyNote.bind(this);
  }

  async loadDailyNoteSettings() {
    const adapter = new FileSystemAdapter();
    try {
      const dailyNoteSettingsFile = await fs.promises.readFile(
        path.join(adapter.getBasePath(), "daily-notes.json"),
        "utf-8"
      );
      const { directory, format, template } = JSON.parse(dailyNoteSettingsFile);

      this.dailyNoteDirectory = directory || "";
      this.dateFormat = format || "YYYY-MM-DD";
      this.dailyNoteTemplate = template || "";
    } catch (err) {
      console.info("No custom daily note settings found!");
    }
  }

  getViewType() {
    return VIEW_TYPE_CALENDAR;
  }

  load() {
    super.load();

    const { activeLeaf } = this.app.workspace;
    const vault = this.app.vault;

    new Calendar({
      target: this.containerEl,
      props: {
        activeLeaf,
        openOrCreateFile: this._openFileByName,
        vault,
        directory: this.dailyNoteDirectory,
        format: this.dateFormat,
      },
    });
  }

  getDisplayText() {
    return "Calendar";
  }

  getIcon() {
    return "calendar-with-checkmark";
  }

  _openFileByName(filename: string) {
    const { vault, workspace } = this.app;

    const baseFilename = path.parse(filename).name;

    const fileObj = vault.getAbstractFileByPath(
      path.join(this.dailyNoteDirectory, `${baseFilename}.md`)
    ) as TFile;

    if (!fileObj) {
      this.promptUserToCreateFile(baseFilename);
      return;
    }
    workspace.activeLeaf.openFile(fileObj);
  }

  async _createDailyNote(filename: string) {
    const { workspace } = this.app;

    const templateContents = fs.readFileSync(this.dailyNoteTemplate, "utf-8");
    const dailyNote = await createFileFromTemplate({
      filename,
      templateContents,
    });

    workspace.activeLeaf.openFile(dailyNote);
  }

  promptUserToCreateFile(filename: string) {
    modal.createConfirmationDialog({
      cta: "Create",
      onAccept: () => this._createDailyNote(filename),
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  }
}
