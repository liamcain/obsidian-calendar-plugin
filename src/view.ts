import { Events, FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import Calendar from "./Calendar.svelte";
import { VIEW_TYPE_CALENDAR } from "./constants";
import {
  createDailyNote,
  getDailyNoteSettings,
  tryToCreateDailyNote,
} from "./dailyNotes";
import type { IMoment } from "./moment";
import { getNotePath } from "./path";
import { getWeeklyNoteSettings, ISettings } from "./settings";
import type { IWeek } from "./ui/utils";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf, settings: ISettings) {
    super(leaf);

    this.settings = settings;

    this._openOrCreateDailyNote = this._openOrCreateDailyNote.bind(this);
    this._openOrCreateWeeklyNote = this._openOrCreateWeeklyNote.bind(this);
    this.redraw = this.redraw.bind(this);
    this.onHover = this.onHover.bind(this);

    this.registerEvent(this.app.vault.on("delete", this.redraw));

    // Register a custom event on the workspace for other plugins to
    // hook into for creating daily-notes
    //
    // example usage: workspace.trigger('create-daily-note', momentDate)
    this.registerEvent(
      (this.app.workspace as Events).on("create-daily-note", createDailyNote)
    );
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

  onHover(targetEl: EventTarget, filepath: string) {
    this.app.workspace.trigger("link-hover", this, targetEl, "", filepath);
  }

  async onOpen() {
    const { vault, workspace } = this.app;
    const activeLeaf = workspace.activeLeaf;
    const activeFile = activeLeaf
      ? (activeLeaf.view as FileView).file?.path
      : null;

    this.calendar = new Calendar({
      target: (this as any).contentEl,
      props: {
        activeFile,
        openOrCreateDailyNote: this._openOrCreateDailyNote,
        openOrCreateWeeklyNote: this._openOrCreateWeeklyNote,
        vault,
        onHover: this.onHover,
      },
    });
  }

  public async redraw() {
    if (this.calendar) {
      const { vault, workspace } = this.app;
      const activeLeaf = workspace.activeLeaf;
      this.calendar.$set({
        activeLeaf,
        vault,
      });
    }
  }

  async _openOrCreateWeeklyNote(
    week: IWeek,
    inNewSplit: boolean
  ): Promise<void> {
    const { vault, workspace } = this.app;

    const weeklyNoteSettings = getWeeklyNoteSettings(this.settings);
    const { date } = week.find((day) => !!day.date);
    const baseFilename = date.format(weeklyNoteSettings.format);

    const fullPath = getNotePath(weeklyNoteSettings.folder, baseFilename);
    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      // File doesn't exist
      tryToCreateDailyNote(
        date,
        inNewSplit,
        weeklyNoteSettings,
        this.settings,
        () => {
          this.calendar.$set({
            activeFile: baseFilename,
            vault,
          });
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(fileObj);

    this.calendar.$set({
      activeFile: fileObj.basename,
    });
  }

  async _openOrCreateDailyNote(
    date: IMoment,
    inNewSplit: boolean
  ): Promise<void> {
    const { vault, workspace } = this.app;

    const dailyNoteSettings = getDailyNoteSettings();
    const baseFilename = date.format(dailyNoteSettings.format);
    const fullPath = getNotePath(dailyNoteSettings.folder, baseFilename);

    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      // File doesn't exist
      tryToCreateDailyNote(
        date,
        inNewSplit,
        dailyNoteSettings,
        this.settings,
        () => {
          this.calendar.$set({
            activeFile: baseFilename,
            vault,
          });
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(fileObj);

    this.calendar.$set({
      activeFile: fileObj.basename,
    });
  }
}
