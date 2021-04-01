import type { Moment } from "moment";
import { IGranularity, getDateFromFile } from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import type { ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import {
  activeFile,
  dailyNotes,
  weeklyNotes,
  settings,
  sources,
} from "./ui/stores";
import {
  // customTagsSource,
  // streakSource,
  wordCountSource,
  tasksSource,
  linksSource,
  backlinksSource,
  zettelsSource,
} from "./ui/sources";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.onNoteSettingsUpdate = this.onNoteSettingsUpdate.bind(this);
    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);
    this.onFileModified = this.onFileModified.bind(this);
    this.onFileRenamed = this.onFileRenamed.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);

    this.openOrCreatePeriodicNote = this.openOrCreatePeriodicNote.bind(this);
    this.onHover = this.onHover.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    this.registerEvent(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>this.app.workspace).on(
        "periodic-notes:settings-updated",
        this.onNoteSettingsUpdate
      )
    );
    this.registerEvent(this.app.vault.on("create", this.onFileCreated));
    this.registerEvent(this.app.vault.on("delete", this.onFileDeleted));
    this.registerEvent(this.app.vault.on("modify", this.onFileModified));
    this.registerEvent(this.app.vault.on("rename", this.onFileRenamed));
    this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen));

    this.settings = null;
    settings.subscribe((val) => {
      this.settings = val;
    });
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
    // Integration point: external plugins can listen for `calendar:open`
    // to feed in additional sources.
    const baseSources = [
      // customTagsSource,
      // streakSource,
      wordCountSource,
      tasksSource,
      linksSource,
      backlinksSource,
      zettelsSource,
    ];
    // TODO move this into a writable. subscribe the settings component
    // to the writable
    this.app.workspace.trigger(TRIGGER_ON_OPEN, baseSources);
    baseSources.forEach(sources.registerSource);

    this.calendar = new Calendar({
      target: this.contentEl,
      props: {
        app: this.app,
        eventHandlers: {
          onClickDay: this.openOrCreatePeriodicNote,
          onHoverDay: this.onHover,
          onContextMenuDay: this.onContextMenu,
        },
      },
    });
  }

  private onHover(
    _periodicity: IGranularity,
    date: Moment,
    file: TFile,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    // const { format } = getDailyNoteSettings();
    // const { format } = getWeeklyNoteSettings();
    const format = ""; // TODO
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      file?.path
    );
  }

  private onContextMenu(
    _periodicity: IGranularity,
    _date: Moment,
    file: TFile,
    event: MouseEvent
  ): void {
    if (!file) {
      // If no file exists for a given day, show nothing.
      return;
    }
    showFileMenu(this.app, file, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  async openOrCreatePeriodicNote(
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;
    // const existingFile = getDailyNote(date, get(dailyNotes));
    // const startOfWeek = date.clone().startOf("week");
    // const existingFile = getWeeklyNote(date, get(weeklyNotes));
    // const startOfMonth = date.clone().startOf("month");
    // const existingFile = getMonthlyNote(date, get(monthlyNotes));

    if (!existingFile) {
      // File doesn't exist
      tryToCreateDailyNote(
        date,
        inNewSplit,
        this.settings,
        (dailyNote: TFile) => {
          activeFile.setFile(dailyNote);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
  }

  private onNoteSettingsUpdate(): void {
    dailyNotes.reindex();
    weeklyNotes.reindex();
    this.updateActiveFile();
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    if (getDateFromFile(file, "day")) {
      dailyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "week")) {
      weeklyNotes.reindex();
      this.updateActiveFile();
    }
  }

  private async onFileModified(file: TFile): Promise<void> {
    const date = getDateFromFile(file, "day") || getDateFromFile(file, "week");
    if (date && this.calendar) {
      this.calendar.tick();
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady && this.calendar) {
      if (getDateFromFile(file, "day")) {
        dailyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "week")) {
        weeklyNotes.reindex();
        this.calendar.tick();
      }
    }
  }

  private onFileRenamed(file: TFile): void {
    if (this.app.workspace.layoutReady && this.calendar) {
      if (getDateFromFile(file, "day")) {
        dailyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "week")) {
        weeklyNotes.reindex();
        this.calendar.tick();
      }
    }
  }

  public onFileOpen(_file: TFile): void {
    if (this.app.workspace.layoutReady) {
      this.updateActiveFile();
    }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    activeFile.setFile(file);
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      // Check to see if the active note is a daily-note
      let date = getDateFromFile(activeLeaf.view.file, "day");
      if (date) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }

      // Check to see if the active note is a weekly-note
      const { format } = getWeeklyNoteSettings();
      date = moment(activeLeaf.view.file.basename, format, true);
      if (date.isValid()) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }
    }
  }
}
