import type { Moment } from "moment";
import {
  TFile,
  ItemView,
  WorkspaceLeaf,
  MarkdownView,
  Platform,
  App,
  type ViewState,
  type ViewStateResult,
} from "obsidian";

import { VIEW_TYPE_CALENDAR } from "src/constants";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import type CalendarPlugin from "./main";
import type { Granularity, ICalendarSource } from "./ui/types";

// TODO move to utils file
export function isMetaPressed(e: MouseEvent | KeyboardEvent): boolean {
  return Platform.isMacOS ? e.metaKey : e.ctrlKey;
}

export interface ICalendarViewState {
  selectedSourceIds: string[];
}

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  public sources: ICalendarSource[] = [];
  private persistedViewState: ICalendarViewState;

  constructor(
    readonly leaf: WorkspaceLeaf,
    readonly app: App,
    readonly plugin: CalendarPlugin
  ) {
    super(leaf);
    this.updateActiveFile = this.updateActiveFile.bind(this);
    this.onNoteSettingsUpdate = this.onNoteSettingsUpdate.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);
    this.openOrCreatePeriodicNote = this.openOrCreatePeriodicNote.bind(this);
    this.onHover = this.onHover.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen));

    this.sources = [...plugin.registeredSources];
    this.persistedViewState = {
      selectedSourceIds: [],
    };
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

  async onClose(): Promise<void> {
    this.calendar?.$destroy();
  }

  async setState(state: ICalendarViewState): Promise<void> {
    this.persistedViewState = state;
  }

  getState() {
    return this.persistedViewState;
  }

  async onOpen(): Promise<void> {
    // TODO move this into a writable. subscribe the settings component
    // to the writable
    // Integration point: external plugins can listen for `calendar:open`
    // to feed in additional sources.
    this.app.workspace.trigger("calendar:open", this.sources);
    // baseSources.forEach(sources.registerSource);

    this.app.workspace.onLayoutReady(() => {
      this.calendar = new Calendar({
        target: this.contentEl,
        props: {
          plugin: this.plugin,
          persistedViewState: this.persistedViewState,
          sources: this.sources,
          eventHandlers: {
            onClick: this.openOrCreatePeriodicNote,
            onHover: this.onHover,
            onContextMenu: this.onContextMenu,
          },
        },
      });
    });
  }

  private onHover(
    granularity: Granularity,
    date: Moment,
    event: MouseEvent | KeyboardEvent
  ): void {
    const file = this.app.plugins
      .getPlugin("periodic-notes")
      .getPeriodicNote(granularity, date);

    this.app.workspace.trigger("hover-link", {
      event: event,
      source: "editor",
      hoverParent: this,
      targetEl: event.target,
      linktext: file?.basename,
      sourcePath: file?.path,
    });
  }

  private onContextMenu(granularity: Granularity, date: Moment, event: MouseEvent): void {
    const file = this.app.plugins
      .getPlugin("periodic-notes")
      .getPeriodicNote(granularity, date);

    showFileMenu(event, this.app, granularity, date, file);
  }

  private async openOrCreatePeriodicNote(
    granularity: Granularity,
    date: Moment,
    event: MouseEvent
  ): Promise<void> {
    this.app.plugins.getPlugin("periodic-notes").openPeriodicNote(granularity, date, {
      inNewSplit: isMetaPressed(event),
    });
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
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    this.plugin.activeFile.set(view?.file);
  }

  public revealActiveNote(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const metadata = this.app.plugins
        .getPlugin("periodic-notes")
        ?.findInCache(view.file.path);
      if (metadata) {
        this.calendar.$set({ displayedMonth: metadata.date });
      }
    }
  }
}
