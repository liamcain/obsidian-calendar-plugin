import type { Moment } from "moment";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getNotePath } from "src/io/path";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import {
  getDailyNote,
  getDailyNoteSettings,
} from "obsidian-daily-notes-interface";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf, settings: ISettings) {
    super(leaf);

    this.settings = settings;

    this._openOrCreateDailyNote = this._openOrCreateDailyNote.bind(this);
    this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);
    this.redraw = this.redraw.bind(this);
    this.onHover = this.onHover.bind(this);

    this.registerEvent(this.app.workspace.on("file-open", this.redraw));
    this.registerEvent(this.app.workspace.on("quick-preview", this.redraw));
    this.registerEvent(this.app.vault.on("delete", this.redraw));
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return "Calendar";
  }

  getIcon(): string {
    return "calendar-with-checkmark";
  }

  onClose(): Promise<void> {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  onHover(targetEl: EventTarget, filepath: string): void {
    this.app.workspace.trigger("link-hover", this, targetEl, "", filepath);
  }

  async onOpen(): Promise<void> {
    const activeLeaf = this.app.workspace.activeLeaf;
    const activeFile = activeLeaf
      ? (activeLeaf.view as FileView).file?.path
      : null;

    this.calendar = new Calendar({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (this as any).contentEl,
      props: {
        activeFile,
        openOrCreateDailyNote: this._openOrCreateDailyNote,
        openOrCreateWeeklyNote: this.openOrCreateWeeklyNote,
        onHover: this.onHover,
      },
    });
  }

  public async redraw(): Promise<void> {
    if (this.calendar) {
      const { workspace } = this.app;
      const view = workspace.activeLeaf.view;

      let activeFile = null;
      if (view instanceof FileView) {
        activeFile = view.file?.basename;
      }
      this.calendar.$set({ activeFile });
    }
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      const { format } = getDailyNoteSettings();
      const displayedMonth = moment(
        activeLeaf.view.file.basename,
        format,
        true
      );
      if (displayedMonth.isValid()) {
        this.calendar.$set({ displayedMonth });
      }
    }
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace, vault } = this.app;

    const startOfWeek = date.clone().weekday(0);

    const { format, folder } = getWeeklyNoteSettings(this.settings);
    const baseFilename = startOfWeek.format(format);

    const fullPath = getNotePath(folder, baseFilename);
    const fileObj = vault.getAbstractFileByPath(fullPath) as TFile;

    if (!fileObj) {
      // File doesn't exist
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, () => {
        this.calendar.$set({ activeFile: baseFilename });
      });
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
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    const fileObj = getDailyNote(date);

    if (!fileObj) {
      // File doesn't exist
      tryToCreateDailyNote(
        date,
        inNewSplit,
        this.settings,
        (dailyNote: TFile) => {
          this.calendar.$set({ activeFile: dailyNote.basename });
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
