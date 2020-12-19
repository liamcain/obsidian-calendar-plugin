import type { Moment } from "moment";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

import { activeFile, displayedMonth } from "./ui/stores";
import { DailyNoteSource } from "./ui/utils";
import Calendar from "./ui/Calendar.svelte";

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
    //  might need to regen dailyNotes on `delete`
    this.registerEvent(this.app.vault.on("modify", this.redraw));
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
        source: DailyNoteSource,

        openOrCreateDailyNote: this._openOrCreateDailyNote,
        openOrCreateWeeklyNote: this.openOrCreateWeeklyNote,
        onHover: this.onHover,
      },
    });
  }

  public async redraw(): Promise<void> {
    if (!this.calendar) {
      return;
    }

    const { workspace } = this.app;
    const view = workspace.activeLeaf.view;

    let activeFilename = null;
    if (view instanceof FileView) {
      activeFilename = view.file?.basename;
    }

    activeFile.update(() => activeFilename);
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      // Check to see if the active note is a daily-note
      let { format } = getDailyNoteSettings();
      let date = moment(activeLeaf.view.file.basename, format, true);
      if (date.isValid()) {
        displayedMonth.update(() => date);
        return;
      }

      // Check to see if the active note is a weekly-note
      format = getWeeklyNoteSettings(this.settings).format;
      date = moment(activeLeaf.view.file.basename, format, true);
      if (date.isValid()) {
        displayedMonth.update(() => date);
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
    const startOfWeek = date.clone().weekday(0);

    if (!existingFile) {
      // File doesn't exist
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, (file) => {
        activeFile.update(() => file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.update(() => existingFile);
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
          activeFile.update(() => dailyNote);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.update(() => existingFile);
  }
}
