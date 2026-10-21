import type { Moment } from "moment";
import {
  getDailyNote,
  getDailyNoteSettings,
  getDateFromFile,
  getWeeklyNote,
  getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { getAllMonthlyNotes, tryToCreateMonthlyNote, getMonthlyNote } from "src/io/monthlyNotes";
import { isCanvasScheduleFile } from "src/io/canvasSchedules";
import type { ISettings } from "src/settings";
import { t } from "./i18n";

import Calendar from "./ui/Calendar.svelte";
import { activeFile, dailyNotes, weeklyNotes, monthlyNotes, canvasSchedules, settings } from "./ui/stores";
import {
  customTagsSource,
  streakSource,
  tasksSource,
  wordCountSource,
  monthlyTasksSource,
  canvasSchedulesSource,
} from "./ui/sources";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.openOrCreateDailyNote = this.openOrCreateDailyNote.bind(this);
    this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);

    this.onNoteSettingsUpdate = this.onNoteSettingsUpdate.bind(this);
    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);
    this.onFileModified = this.onFileModified.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);

    this.onHoverDay = this.onHoverDay.bind(this);
    this.onHoverWeek = this.onHoverWeek.bind(this);

    this.registerEvent(
      (this.app.workspace as Record<string, (...args: unknown[]) => unknown>).on(
        "periodic-notes:settings-updated" as never,
        this.onNoteSettingsUpdate as never
      )
    );
    this.registerEvent(this.app.vault.on("create", this.onFileCreated));
    this.registerEvent(this.app.vault.on("delete", this.onFileDeleted));
    this.registerEvent(this.app.vault.on("modify", this.onFileModified));
    this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen));

    this.settings = null;
    settings.subscribe((val) => {
      this.settings = val;

      // Refresh the calendar if settings change
      if (this.calendar) {
        this.calendar.tick();
      }
    });
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return t('calendar.title');
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
    const sources = [
      customTagsSource,
      streakSource,
      wordCountSource,
      tasksSource,
      monthlyTasksSource,
      canvasSchedulesSource,
    ];
    this.app.workspace.trigger(TRIGGER_ON_OPEN, sources);

    this.calendar = new Calendar({
      target: this.contentEl,
      props: {
        onClickDay: this.openOrCreateDailyNote,
        onClickWeek: this.openOrCreateWeeklyNote,
        onHoverDay: this.onHoverDay,
        onHoverWeek: this.onHoverWeek,
        sources,
      },
    });
  }

  onHoverDay(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const { format } = getDailyNoteSettings();
    const note = getDailyNote(date, get(dailyNotes));
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverWeek(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const note = getWeeklyNote(date, get(weeklyNotes));
    const { format } = getWeeklyNoteSettings();
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  private onNoteSettingsUpdate(): void {
    dailyNotes.reindex();
    weeklyNotes.reindex();
    if (this.settings.showMonthlyNote) {
      monthlyNotes.reindex();
    }
    if (this.settings.showCanvasSchedules) {
      canvasSchedules.reindex(this.settings);
    }
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
    if (this.settings.showMonthlyNote) {
      // Check if it's a yearly monthly-note file by basename pattern
      const monthlyMatch = file.basename.match(/^\d{4}$/);
      if (monthlyMatch) {
        monthlyNotes.reindex();
        this.updateActiveFile();
      }
    }
    if (
      this.settings.showCanvasSchedules &&
      isCanvasScheduleFile(file, this.settings)
    ) {
      await canvasSchedules.reindex(this.settings);
      if (this.calendar) {
        this.calendar.tick();
        this.calendar.refreshCanvasSchedules();
      }
    }
  }

  private async onFileModified(file: TFile): Promise<void> {
    const date = getDateFromFile(file, "day") || getDateFromFile(file, "week");
    if (date && this.calendar) {
      this.calendar.tick();
    }
    if (this.settings.showMonthlyNote) {
      const monthlyMatch = file.basename.match(/^\d{4}$/);
      if (monthlyMatch && this.calendar) {
        this.calendar.tick();
        this.calendar.refreshMonthlyContent();
      }
    }
    if (
      this.settings.showCanvasSchedules &&
      isCanvasScheduleFile(file, this.settings)
    ) {
      await canvasSchedules.reindex(this.settings);
      if (this.calendar) {
        this.calendar.tick();
        this.calendar.refreshCanvasSchedules();
      }
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
      if (this.settings.showMonthlyNote) {
        const monthlyMatch = file.basename.match(/^\d{4}$/);
        if (monthlyMatch) {
          monthlyNotes.reindex();
          this.calendar.tick();
        }
      }
      if (
        this.settings.showCanvasSchedules &&
        isCanvasScheduleFile(file, this.settings)
      ) {
        canvasSchedules.reindex(this.settings).then(() => {
          if (this.calendar) {
            this.calendar.tick();
            this.calendar.refreshCanvasSchedules();
          }
        });
      }
    }
  }

  public onFileOpen(_file: TFile): void {
    if (this.app.workspace.layoutReady) {
      this.updateActiveFile();
    }
  }

  private updateActiveFile(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    const view = activeLeaf?.view;

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    activeFile.setFile(file);

    if (this.calendar) {
      this.calendar.tick();
    }
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

      // Check to see if the active note is a monthly-note
      const monthlyMatch = activeLeaf.view.file.basename.match(/^(\d{4}-\d{2})/);
      if (monthlyMatch) {
        date = moment(monthlyMatch[1], "YYYY-MM", true);
        if (date.isValid()) {
          this.calendar.$set({ displayedMonth: date });
          return;
        }
      }
    }
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfWeek = date.clone().startOf("week");

    const existingFile = getWeeklyNote(date, get(weeklyNotes));

    if (!existingFile) {
      // File doesn't exist
      tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true)
  }

  async openOrCreateDailyNote(
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
        (dailyNote: TFile) => {
          activeFile.setFile(dailyNote);
        }
      );
      return;
    }

    const mode = (this.app.vault as { getConfig: (key: string) => string }).getConfig("defaultViewMode");
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile, { active: true, mode });

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }

  async openOrCreateMonthlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const monthlyNotesData = getAllMonthlyNotes();
    const existingFile = getMonthlyNote(date, monthlyNotesData);

    if (!existingFile) {
      tryToCreateMonthlyNote(date, inNewSplit, this.settings, (file) => {
        monthlyNotes.reindex();
        activeFile.setFile(file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }
}
