import type { Moment } from "moment";
import { getDailyNote, getDateFromFile } from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";
import { MetadataCache } from "obsidian-calendar-ui";
import { get } from "svelte/store";

import { VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

import { activeFile, dailyNotes } from "./ui/stores";
import Calendar from "./ui/Calendar.svelte";
import DailyNoteSource from "./ui/sources/DailyNoteSource";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private metadata: MetadataCache;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf, settings: ISettings) {
    super(leaf);

    this.settings = settings;

    this._openOrCreateDailyNote = this._openOrCreateDailyNote.bind(this);
    this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);

    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);
    this.onFileModified = this.onFileModified.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);

    this.onHover = this.onHover.bind(this);

    this.registerEvent(this.app.vault.on("create", this.onFileCreated));
    this.registerEvent(this.app.vault.on("delete", this.onFileDeleted));
    this.registerEvent(this.app.vault.on("modify", this.onFileModified));
    this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen));
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
    dailyNotes.reindex();
    this.metadata = new MetadataCache(new DailyNoteSource());

    this.calendar = new Calendar({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (this as any).contentEl,
      props: {
        onClickDay: this._openOrCreateDailyNote,
        onClickWeek: this.openOrCreateWeeklyNote,
        onHoverDay: this.onHover,
        onHoverWeek: this.onHover,
        metadata: this.metadata,
      },
    });
  }

  onHover(date: Moment, targetEl: EventTarget): void {
    const note = getDailyNote(date, get(dailyNotes));
    // TODO: Fix this ""
    this.app.workspace.trigger("link-hover", this, targetEl, "", note?.path);
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    const date = getDateFromFile(file);
    if (date) {
      dailyNotes.reindex();
      this.updateActiveFile();
    }
  }

  private async onFileModified(file: TFile): Promise<void> {
    const date = getDateFromFile(file);
    if (date) {
      this.metadata.refreshDay(date);
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady) {
      const date = getDateFromFile(file);
      if (date) {
        dailyNotes.reindex();
      }
    }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
      this.metadata.selectedDate.set(getDateFromFile(file));
    }
    activeFile.set(file);
  }

  public onFileOpen(_file: TFile): void {
    this.updateActiveFile();
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      // Check to see if the active note is a daily-note
      let date = getDateFromFile(activeLeaf.view.file);
      if (date) {
        this.metadata.displayedMonth.set(date);
        return;
      }

      // Check to see if the active note is a weekly-note
      const format = getWeeklyNoteSettings(this.settings).format;
      date = moment(activeLeaf.view.file.basename, format, true);
      if (date.isValid()) {
        this.metadata.displayedMonth.set(date);
        return;
      }
    }
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    const startOfWeek = date.clone().weekday(0);

    const existingFile = getDailyNote(date, get(dailyNotes));

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
    const existingFile = getDailyNote(date, get(dailyNotes));
    if (!existingFile) {
      // File doesn't exist
      tryToCreateDailyNote(
        date,
        inNewSplit,
        this.settings,
        (dailyNote: TFile) => {
          // this.dailyNotesSource.reindex();
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
