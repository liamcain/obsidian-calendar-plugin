import type { TFile, WorkspaceLeaf } from "obsidian";
import * as fs from "fs";
import * as path from "path";

import Calendar from "./Calendar.svelte";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { createDailyNote, createFileFromTemplate } from "./template";
import { View } from "./types";
import { modal } from "./ui";

export default class CalendarView extends View {
  calendar: Calendar;

  dailyNoteDirectory: string;
  dailyNoteTemplate: string;
  dateFormat: string;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.dailyNoteDirectory = "";
    this.dateFormat = "YYYY-MM-DD";
    this.dailyNoteTemplate = "";

    this._openFileByName = this._openFileByName.bind(this);
    this._createDailyNote = this._createDailyNote.bind(this);

    this.loadDailyNoteSettings().then(this.open);
  }

  getViewType() {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText() {
    return "Calendar";
  }

  getIcon() {
    return "calendar-with-checkmark";
  }

  async loadDailyNoteSettings() {
    const adapter = this.app.vault.adapter as any;
    const basePath = adapter.basePath;

    try {
      const dailyNoteSettingsFile = await fs.promises.readFile(
        path.join(basePath, ".obsidian/daily-notes.json"),
        "utf-8"
      );
      const { directory, format, template } = JSON.parse(dailyNoteSettingsFile);

      this.dailyNoteDirectory = directory || "";
      this.dateFormat = format || "YYYY-MM-DD";
      this.dailyNoteTemplate = template
        ? path.join(basePath, `${template}.md`)
        : "";
    } catch (err) {
      console.info("No custom daily note settings found!", err);
    }
  }

  open() {
    super.open();

    const {
      vault,
      workspace: { activeLeaf },
    } = this.app;

    this.calendar = new Calendar({
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

  _openFileByName(filename: string) {
    const { vault, workspace } = this.app;

    const baseFilename = path.parse(filename).name;
    const fullPath = path.join(this.dailyNoteDirectory, `${baseFilename}.md`);
    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      this.promptUserToCreateFile(baseFilename, this.dailyNoteDirectory);
      return;
    }
    workspace.activeLeaf.openFile(fileObj);
  }

  async _createDailyNote(directory: string, filename: string) {
    const { workspace } = this.app;

    const templateContents = this.dailyNoteTemplate
      ? fs.readFileSync(this.dailyNoteTemplate, "utf-8")
      : "";

    const dailyNote = await createDailyNote(
      directory,
      filename,
      templateContents
    );

    workspace.activeLeaf.openFile(dailyNote);
  }

  promptUserToCreateFile(filename: string, directory: string) {
    modal.createConfirmationDialog(this.app, {
      cta: "Create",
      onAccept: () => this._createDailyNote(directory, filename),
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  }
}
