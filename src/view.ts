import type { Moment } from "moment";
import {
  getDailyNote,
  getDailyNoteSettings,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

import { activeFile, displayedMonth, dayCache } from "./ui/stores";
import DailyNoteSource from "./ui/sources/DailyNoteSource";
import Calendar from "./ui/Calendar.svelte";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;
  private dailyNotesSource: DailyNoteSource;

  constructor(leaf: WorkspaceLeaf, settings: ISettings) {
    super(leaf);

    this.settings = settings;
    this.dailyNotesSource = new DailyNoteSource(this.settings);

    this._openOrCreateDailyNote = this._openOrCreateDailyNote.bind(this);
    this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);

    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);

    this.onHover = this.onHover.bind(this);
    this.redraw = this.redraw.bind(this);

    this.registerEvent(this.app.vault.on("create", this.onFileCreated));
    this.registerEvent(this.app.vault.on("delete", this.onFileDeleted));
    this.registerEvent(this.app.vault.on("modify", this.redraw));
    this.registerEvent(this.app.workspace.on("file-open", this.redraw));
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

  async onOpen(): Promise<void> {
    this.calendar = new Calendar({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (this as any).contentEl,
      props: {
        source: this.dailyNotesSource,
        onClick: this._openOrCreateDailyNote,
        openOrCreateWeeklyNote: this.openOrCreateWeeklyNote,
        onHover: this.onHover,
      },
    });
  }

  onHover(date: Moment, targetEl: EventTarget): void {
    const note = getDailyNote(date, this.dailyNotesSource.dailyNotes);
    // TODO: Fix this ""
    this.app.workspace.trigger("link-hover", this, targetEl, "", note?.path);
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    this.dailyNotesSource.reindex();
    this.updateActiveFile();
    this.redraw();
    // dayCache.set()
  }

  private onFileCreated(file: TFile): void {
    // if file is daily note
    // dayCache.add(date, file);
    // if (this.app.workspace.layoutReady) {
    //   this.dailyNotesSource.reindex();
    //   dayCache.add('', () => Date.now());
    // }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;
    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    activeFile.update(() => file);
  }

  public redraw(): void {
    this.updateActiveFile();
    // dayCache.set
    // lastUpdatedAt.update(() => Date.now());
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      // Check to see if the active note is a daily-note
      let date = getDateFromFile(activeLeaf.view.file);
      if (date) {
        displayedMonth.update(() => date);
        return;
      }

      // Check to see if the active note is a weekly-note
      const format = getWeeklyNoteSettings(this.settings).format;
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
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    const existingFile = getDailyNote(date, this.dailyNotesSource.dailyNotes);
    if (!existingFile) {
      // File doesn't exist
      tryToCreateDailyNote(
        date,
        inNewSplit,
        this.settings,
        (dailyNote: TFile) => {
          this.dailyNotesSource.reindex();
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
