import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import Calendar from "./Calendar.svelte";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { normalizedJoin } from "./path";
import {
  getDailyNoteSettings,
  getDateFormat,
  getNoteFolder,
  IDailyNoteSettings,
  ISettings,
} from "./settings";
import { IMoment, createDailyNote } from "./template";
import { modal } from "./ui";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private dailyNoteSettings: IDailyNoteSettings;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf, settings: ISettings) {
    super(leaf);

    this.settings = settings;

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

    this.dailyNoteSettings = getDailyNoteSettings();

    const activeFile = activeLeaf
      ? (activeLeaf.view as FileView).file?.path
      : null;

    this.calendar = new Calendar({
      target: (this as any).contentEl,
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

  _getFormattedDate(date: IMoment): string {
    const format = getDateFormat(this.settings);
    return date.format(format);
  }

  async _openOrCreateDailyNote(date: IMoment): Promise<void> {
    const { vault, workspace } = this.app;

    const baseFilename = this._getFormattedDate(date);
    const fullPath = normalizedJoin(
      getNoteFolder(this.settings),
      `${baseFilename}.md`
    );
    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      this.promptUserToCreateFile(date, () => {
        // If the user presses 'Confirm', update the calendar view
        this.calendar.$set({
          activeFile: baseFilename,
          vault,
        });
      });
      return;
    }

    await workspace.getUnpinnedLeaf().openFile(fileObj);
    this.calendar.$set({
      activeFile: fileObj.basename,
    });
  }

  async _createDailyNote(date: IMoment): Promise<void> {
    const dailyNote = await createDailyNote(date, this.settings);

    this.app.workspace.getUnpinnedLeaf().openFile(dailyNote);
  }

  promptUserToCreateFile(date: IMoment, cb: () => void) {
    const filename = this._getFormattedDate(date);

    modal.createConfirmationDialog(this.app, {
      cta: "Create",
      onAccept: () =>
        this._createDailyNote(date).then(() => {
          if (cb) {
            cb();
          }
        }),
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  }
}
