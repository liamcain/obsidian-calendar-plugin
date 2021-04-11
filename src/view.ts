import type { Moment } from "moment";
import {
  IGranularity,
  getDateFromFile,
  getPeriodicNoteSettings,
} from "obsidian-daily-notes-interface";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreatePeriodicNote } from "src/io/dailyNotes";
import type { ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import { activeFile, settings, sources } from "./ui/stores";
import {
  emojiTagsSource,
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
    this.onFileOpen = this.onFileOpen.bind(this);
    this.openOrCreatePeriodicNote = this.openOrCreatePeriodicNote.bind(this);
    this.onHover = this.onHover.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

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
      wordCountSource,
      tasksSource,
      linksSource,
      backlinksSource,
      zettelsSource,
      emojiTagsSource,
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
          onClick: this.openOrCreatePeriodicNote,
          onHover: this.onHover,
          onContextMenu: this.onContextMenu,
        },
      },
    });
  }

  private onHover(
    granularity: IGranularity,
    date: Moment,
    file: TFile,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const { format } = getPeriodicNoteSettings(granularity);
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      file?.path
    );
  }

  private onContextMenu(
    _granularity: IGranularity,
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
    granularity: IGranularity,
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    if (!existingFile) {
      // File doesn't exist
      tryToCreatePeriodicNote(
        granularity,
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
    this.updateActiveFile();
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
    const { activeLeaf } = this.app.workspace;
    if (activeLeaf.view instanceof FileView) {
      for (const granularity of ["day", "week", "month"] as IGranularity[]) {
        const date = getDateFromFile(activeLeaf.view.file, granularity);
        if (date) {
          this.calendar.$set({ displayedMonth: date });
          return;
        }
      }
    }
  }
}
