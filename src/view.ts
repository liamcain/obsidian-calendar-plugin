import { FileView, Notice, TFile, View, WorkspaceLeaf } from "obsidian";
import * as path from "path";

import Calendar from "./Calendar.svelte";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { createDailyNote, normalize, normalizedJoin } from "./template";
import { modal } from "./ui";

export interface IDailyNoteSettings {
  folder?: string;
  format?: string;
  template?: string;
}

export default class CalendarView extends View {
  calendar: Calendar;
  dailyNoteSettings: IDailyNoteSettings;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this._openOrCreateDailyNote = this._openOrCreateDailyNote.bind(this);
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

    this.dailyNoteSettings = this.getDailyNoteSettings();

    const activeFile = activeLeaf
      ? (activeLeaf.view as FileView).file?.path
      : null;

    this.calendar = new Calendar({
      target: this.containerEl,
      props: {
        activeFile,
        dailyNoteSettings: this.dailyNoteSettings,
        openOrCreateDailyNote: this._openOrCreateDailyNote,
        vault,
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
  getDailyNoteSettings(): IDailyNoteSettings {
    try {
      // XXX: Access private API for internal plugins
      return (this.app as any).internalPlugins.plugins["daily-notes"].instance
        .options;
    } catch (err) {
      console.info("No custom daily note settings found!", err);
    }
  }

  async _openOrCreateDailyNote(filename: string): Promise<void> {
    const { vault, workspace } = this.app;

    const baseFilename = path.parse(filename).name;
    const fullPath = normalizedJoin(
      this.dailyNoteSettings.folder,
      `${baseFilename}.md`
    );
    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      this.promptUserToCreateFile(baseFilename, () => {
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

  async _createDailyNote(filename: string): Promise<void> {
    const { vault, workspace } = this.app;
    const { template } = this.dailyNoteSettings;

    let templateContents = "";
    if (template) {
      try {
        const templateFile = vault.getAbstractFileByPath(
          normalize(template)
        ) as TFile;
        templateContents = await vault.cachedRead(templateFile);
      } catch (err) {
        console.error("Failed to read daily note template", err);
        new Notice("Failed to read the daily note template");
        return;
      }
    }

    const dailyNote = await createDailyNote(
      this.dailyNoteSettings.folder,
      filename,
      templateContents
    );

    workspace.activeLeaf.openFile(dailyNote);
  }

  promptUserToCreateFile(filename: string, cb: () => void) {
    modal.createConfirmationDialog(this.app, {
      cta: "Create",
      onAccept: () =>
        this._createDailyNote(filename).then(() => {
          if (cb) {
            cb();
          }
        }),
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  }
}
