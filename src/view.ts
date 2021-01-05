import type { Moment } from "moment";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

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

  onHover(targetEl: EventTarget, filename: string, note: TFile): void {
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      filename,
      note?.path
    );
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
      // Check to see if the active note is a daily-note
      let { format } = getDailyNoteSettings();
      let displayedMonth = moment(activeLeaf.view.file.basename, format, true);
      if (displayedMonth.isValid()) {
        this.calendar.$set({ displayedMonth });
        return;
      }

      // Check to see if the active note is a weekly-note
      format = getWeeklyNoteSettings(this.settings).format;
      displayedMonth = moment(activeLeaf.view.file.basename, format, true);
      if (displayedMonth.isValid()) {
        this.calendar.$set({ displayedMonth });
        return;
      }
    }
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfWeek = date.clone().startOf("week");

    const { format } = getWeeklyNoteSettings(this.settings);
    const baseFilename = startOfWeek.format(format);

    if (!existingFile) {
      // File doesn't exist
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, () => {
        this.calendar.$set({ activeFile: baseFilename });
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    this.calendar.$set({
      activeFile: existingFile.basename,
    });
  }

  async _openOrCreateDailyNote(
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    if (!existingFile) {
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
    await leaf.openFile(existingFile);

    this.calendar.$set({
      activeFile: existingFile.basename,
    });
  }
}
