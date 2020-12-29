import type { Moment } from "moment";
import { getDateFromFile } from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";
import { MetadataStore } from "obsidian-calendar-ui";

import { VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getWeeklyNoteSettings, ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import dailyNoteSource from "./ui/sources/dailyNotes";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private metadata: MetadataStore;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf, settings: ISettings) {
    super(leaf);

    this.settings = settings;

    this.openOrCreateDailyNote = this.openOrCreateDailyNote.bind(this);
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

  public getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  public getDisplayText(): string {
    return "Calendar";
  }

  public getIcon(): string {
    return "calendar-with-checkmark";
  }

  public onClose(): Promise<void> {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  public async onOpen(): Promise<void> {
    this.metadata = new MetadataStore([dailyNoteSource]);
    this.calendar = new Calendar({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (this as any).contentEl,
      props: {
        onClickDay: this.openOrCreateDailyNote,
        onClickWeek: this.openOrCreateWeeklyNote,
        onHoverDay: this.onHover,
        onHoverWeek: this.onHover,
        metadata: this.metadata,
      },
    });
  }

  private onHover(
    file: TFile | null,
    _date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (isMetaPressed) {
      this.app.workspace.trigger("link-hover", this, targetEl, "", file?.path);
    }
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    const date = getDateFromFile(file);
    if (date) {
      this.metadata.dailyNotes.reindex();
      this.updateActiveFile();
    }
  }

  private async onFileModified(file: TFile): Promise<void> {
    const date = getDateFromFile(file);
    if (date) {
      // XXX: Trigger a rerender of the calendar
      this.calendar.$set({ metadata: this.metadata });
      console.log("this.calendar", this.calendar);
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady) {
      const date = getDateFromFile(file);
      if (date) {
        this.metadata.dailyNotes.reindex();
      }
    }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;
    console.log("updateActiveFile");

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    this.metadata.activeFile.set(file);
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

  public async openOrCreateWeeklyNote(
    existingFile: TFile,
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    const startOfWeek = date.clone().weekday(0);

    if (!existingFile) {
      // File doesn't exist
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, (file) => {
        this.metadata.activeFile.update(() => file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    this.metadata.activeFile.update(() => existingFile);
  }

  private async openOrCreateDailyNote(
    existingFile: TFile,
    date: Moment,
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
          this.metadata.activeFile.update(() => dailyNote);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    this.metadata.activeFile.update(() => existingFile);
  }
}
