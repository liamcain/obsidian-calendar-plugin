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
import type { ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import { activeFile, dailyNotes, weeklyNotes, settings } from "./ui/stores";
import {
  streakSource,
  tasksSource,
  wordCountSource,
  leaveDaySource,
} from "./ui/sources";
import { invalidateAllCache, setAppInstance } from "./ui/sources/leaveDay";
import { statusSource, setStatusResolver, setWeatherStore } from "./ui/sources/statusSource";
import { StatusConfigStore } from "./status/StatusConfigStore";
import { StatusResolver } from "./status/StatusResolver";
import { GeoLocator } from "./weather/GeoLocator";
import { WeatherStore } from "./weather/WeatherStore";
import { WeatherAutoWriter } from "./weather/WeatherAutoWriter";


export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;
  private statusConfigStore: StatusConfigStore;
  private statusResolver: StatusResolver;
  private weatherStore: WeatherStore;
  private weatherAutoWriter: WeatherAutoWriter;
  private geoLocator: GeoLocator;

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

    this.onContextMenuDay = this.onContextMenuDay.bind(this);
    this.onContextMenuWeek = this.onContextMenuWeek.bind(this);

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
    console.log("[Calendar+] onOpen() started");
    // Pass app instance to leaveDay module for cache file access
    try {
      setAppInstance(this.app);
    } catch (e) {
      console.warn("[Calendar+] Failed to set app instance:", e);
    }

    console.log("[Calendar+] Initializing StatusConfigStore...");
    // Initialize StatusConfigStore and StatusResolver (non-blocking, error-safe)
    try {
      this.statusConfigStore = new StatusConfigStore(this.app);
      await this.statusConfigStore.load();
      this.statusResolver = new StatusResolver(this.app, this.statusConfigStore);
      setStatusResolver(this.statusResolver);
    } catch (e) {
      console.warn("[Calendar+] StatusResolver initialization failed:", e);
    }

    console.log("[Calendar+] Status init done. Initializing Weather...");
    // Initialize Weather modules (non-blocking, error-safe)
    try {
      this.geoLocator = new GeoLocator();
      this.weatherStore = new WeatherStore();
      setWeatherStore(this.weatherStore);

      // Initialize weather location if enabled (don't await — non-blocking)
      if (this.settings?.enableWeather) {
        this.initWeatherLocation().catch((e) =>
          console.warn("[Calendar+] Weather location init failed:", e)
        );
      }
      this.weatherAutoWriter = new WeatherAutoWriter(this.app, this.weatherStore);
      this.weatherAutoWriter.setEnabled(
        this.settings?.enableWeather === true && this.settings?.autoWriteWeather !== false
      );
    } catch (e) {
      console.warn("[Calendar+] Weather initialization failed:", e);
    }

    // Integration point: external plugins can listen for `calendar:open`
    // to feed in additional sources.
    const sources = [
      streakSource,
      wordCountSource,
      tasksSource,
    ];

    // Add statusSource or leaveDaySource (which internally falls back to leaveDaySource)
    try {
      if (this.settings?.showDayMarkers !== false) {
        if (this.settings?.enableStatusTags !== false) {
          sources.push(statusSource);
        } else {
          sources.push(leaveDaySource);
        }
      }
    } catch (e) {
      console.warn("[Calendar+] Source setup failed, using leaveDaySource:", e);
      sources.push(leaveDaySource);
    }

    console.log("[Calendar+] Sources:", sources.length, "Creating Calendar component...");
    this.app.workspace.trigger(TRIGGER_ON_OPEN, sources);

    console.log("[Calendar+] Creating Svelte Calendar component...");
    try {
      this.calendar = new Calendar({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target: (this as any).contentEl,
        props: {
          onClickDay: this.openOrCreateDailyNote,
          onClickWeek: this.openOrCreateWeeklyNote,
          onHoverDay: this.onHoverDay,
          onHoverWeek: this.onHoverWeek,
          onContextMenuDay: this.onContextMenuDay,
          onContextMenuWeek: this.onContextMenuWeek,
          sources,
        },
      });
      console.log("[Calendar+] Calendar component created successfully");
    } catch (e) {
      console.error("[Calendar+] FAILED to create Calendar component:", e);
    }
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

  private onContextMenuDay(date: Moment, event: MouseEvent): void {
    const note = getDailyNote(date, get(dailyNotes));
    if (!note) {
      // If no file exists for a given day, show nothing.
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuWeek(date: Moment, event: MouseEvent): void {
    const note = getWeeklyNote(date, get(weeklyNotes));
    if (!note) {
      // If no file exists for a given day, show nothing.
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private async initWeatherLocation(): Promise<void> {
    const city = this.settings?.weatherCity || "";
    const savedLat = this.settings?.weatherLatitude || 0;
    const savedLon = this.settings?.weatherLongitude || 0;

    // If we have a saved location and no manual city change pending, use it
    if (savedLat !== 0 && savedLon !== 0) {
      this.weatherStore.setLocation(savedLat, savedLon);
    }

    // If user specified a city, try to resolve it
    if (city) {
      const location = await this.geoLocator.searchCity(city);
      if (location) {
        this.weatherStore.setLocation(location.latitude, location.longitude);
        // Save coordinates to settings
        this.settings.weatherLatitude = location.latitude;
        this.settings.weatherLongitude = location.longitude;
      }
    } else if (savedLat === 0 || savedLon === 0) {
      // Try IP geolocation
      const location = await this.geoLocator.locateByIP();
      if (location) {
        this.weatherStore.setLocation(location.latitude, location.longitude);
        this.settings.weatherLatitude = location.latitude;
        this.settings.weatherLongitude = location.longitude;
      }
    }

    this.weatherStore.setEnabled(true);
  }

  private onNoteSettingsUpdate(): void {
    dailyNotes.reindex();
    weeklyNotes.reindex();
    this.updateActiveFile();
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    if (getDateFromFile(file, "day")) {
      dailyNotes.reindex();
      invalidateAllCache();
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
      // Invalidate leave cache when a daily note is modified
      // (frontmatter tags may have changed)
      if (getDateFromFile(file, "day")) {
        invalidateAllCache();
        // Also invalidate StatusResolver cache for this date
        if (this.statusResolver) {
          this.statusResolver.invalidateCache(date.format("YYYY-MM-DD"));
        }
      }
      this.calendar.tick();
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady && this.calendar) {
      if (getDateFromFile(file, "day")) {
        dailyNotes.reindex();
        invalidateAllCache();
        if (this.statusResolver) {
          this.statusResolver.invalidateCache();
        }
        this.calendar.tick();

        // Auto-write weather to newly created daily note
        if (this.weatherAutoWriter) {
          const date = getDateFromFile(file, "day");
          if (date) {
            this.weatherAutoWriter.tryWriteWeather(date);
          }
        }
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
        this.settings,
        (dailyNote: TFile) => {
          activeFile.setFile(dailyNote);
        }
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mode = (this.app.vault as any).getConfig("defaultViewMode");
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile, { active : true, mode });

    activeFile.setFile(existingFile);
  }
}
