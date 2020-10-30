import { FileView, TFile, View, WorkspaceLeaf } from "obsidian";
import * as fs from "fs";
import * as path from "path";

import Calendar from "./Calendar.svelte";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { createDailyNote } from "./template";
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
    this.redraw = this.redraw.bind(this);
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

  onClose() {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  async onOpen() {
    const {
      vault,
      workspace: { activeLeaf },
    } = this.app;

    const activeFile = activeLeaf
      ? (activeLeaf.view as FileView).file?.path
      : null;

    await this.loadDailyNoteSettings();

    this.calendar = new Calendar({
      target: this.containerEl,
      props: {
        activeFile,
        openOrCreateFile: this._openFileByName,
        vault,
        directory: this.dailyNoteDirectory,
        format: this.dateFormat,
      },
    });
  }

  public async redraw() {
    if (this.calendar) {
      this.calendar.$set({
        vault: this.app.vault,
      });
    }
  }

  /**
   * Read the user settings for the `daily-notes` plugin
   * to keep behavior of creating a new note in-sync.
   */
  async loadDailyNoteSettings() {
    const adapter = this.app.vault.adapter as any;
    const basePath = adapter.basePath;

    try {
      const dailyNoteSettingsFile = await fs.promises.readFile(
        path.join(basePath, ".obsidian/daily-notes.json"),
        "utf-8"
      );
      const { folder, format, template } = JSON.parse(dailyNoteSettingsFile);

      this.dailyNoteDirectory = folder || "";
      this.dateFormat = format || "YYYY-MM-DD";
      this.dailyNoteTemplate = template
        ? path.join(basePath, `${template}.md`)
        : "";
    } catch (err) {
      console.info("No custom daily note settings found!", err);
    }
  }

  async _openFileByName(filename: string) {
    const { vault, workspace } = this.app;

    const baseFilename = path.parse(filename).name;
    const fullPath = path.join(this.dailyNoteDirectory, `${baseFilename}.md`);
    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      this.promptUserToCreateFile(baseFilename, this.dailyNoteDirectory, () => {
        // If the user presses 'Confirm', update the calendar view
        this.calendar.$set({
          activeFile: baseFilename,
          vault,
        });
      });
      return;
    }

    await workspace.activeLeaf.openFile(fileObj);
    this.calendar.$set({
      activeFile: fileObj.basename,
    });
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

  promptUserToCreateFile(filename: string, directory: string, cb: () => void) {
    modal.createConfirmationDialog(this.app, {
      cta: "Create",
      onAccept: () =>
        this._createDailyNote(directory, filename).then(() => {
          if (cb) {
            cb();
          }
        }),
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  }
}
