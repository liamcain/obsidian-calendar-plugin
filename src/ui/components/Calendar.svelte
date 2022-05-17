<svelte:options immutable />

<script lang="ts">
  import type { EventRef, PeriodicNoteCachedMetadata } from "obsidian";
  import { Platform, debounce, App, TFile } from "obsidian";
  import type { Locale, Moment } from "moment";
  import { onDestroy, onMount, setContext } from "svelte";
  import { writable } from "svelte/store";

  import type {
    CalendarEventHandlers,
    Granularity,
    ICalendarSource,
    ISourceSettings,
  } from "src/types";

  import { ACTIVE_FILE, DISPLAYED_MONTH, IS_MOBILE, TODAY } from "../context";
  import PopoverMenu from "../components/popover/PopoverMenu.svelte";
  import Day from "./Day.svelte";
  import Nav from "./Nav.svelte";
  import Toolbar from "./Toolbar.svelte";
  import WeekNum from "./WeekNum.svelte";
  import type { IEvaluatedMetadata, IMonth } from "../types";
  import {
    getDaysOfWeek,
    getMonth,
    getSourceColors,
    isWeekend,
  } from "../utils";

  let today: Moment = window.moment();

  export let isISO: boolean;
  export let localeData: Locale;
  export let showWeekNums: boolean = false;
  export let eventHandlers: CalendarEventHandlers;

  // External sources (All optional)
  export let app: App;
  export let sources: ICalendarSource[] = [];
  export let sourceSettings: Record<string, ISourceSettings> = {};

  export let displayedMonth: Moment = today;

  // Override-able local state
  let displayedMonthStore = writable<Moment>(displayedMonth);
  let todayStore = writable<Moment>(today);
  let month: IMonth;
  let daysOfWeek: string[];

  let hoverTimeout: number;
  let showPopover: boolean = false;
  let popoverMetadata: IEvaluatedMetadata;
  let activeFile = writable<TFile | null>(null);
  let hoveredDay = writable<HTMLElement | null>(null);
  let selectedSourceIds: string[] = sources.map((s) => s.id);
  let visibleSources: ICalendarSource[];

  setContext(TODAY, todayStore);
  setContext(IS_MOBILE, Platform.isMobile);
  setContext(DISPLAYED_MONTH, displayedMonthStore);
  setContext(ACTIVE_FILE, activeFile);

  $: month = getMonth($displayedMonthStore, isISO, localeData);
  $: daysOfWeek = getDaysOfWeek($todayStore, localeData);
  $: visibleSources = sources;

  function openPopover() {
    showPopover = true;
  }

  function updateVisibleSources(event: CustomEvent) {
    const { sourceId, isolated } = event.detail;
    if (isolated) {
      if (
        selectedSourceIds.includes(sourceId) &&
        selectedSourceIds.length === 1
      ) {
        // is isolated, select all
        selectedSourceIds = sources.map((s) => s.id);
      } else {
        // not isolated, isolate
        selectedSourceIds = [sourceId];
      }
    } else if (selectedSourceIds.includes(sourceId)) {
      selectedSourceIds = selectedSourceIds.filter((s) => s !== sourceId);
    } else {
      selectedSourceIds = [...selectedSourceIds, sourceId];
    }
    visibleSources = sources.filter((s) => selectedSourceIds.includes(s.id));
  }

  function updatePopover(event: CustomEvent) {
    const { metadata, target } = event.detail;

    if (!showPopover) {
      window.clearTimeout(hoverTimeout);
      hoverTimeout = window.setTimeout(() => {
        if ($hoveredDay === target) {
          openPopover();
        }
      }, 750);
    }

    if ($hoveredDay !== target) {
      hoveredDay.set(target);
      popoverMetadata = metadata;
    }
  }

  const dismissPopover = debounce(
    (event: CustomEvent) => {
      // if the user didn't hover onto another day
      if ($hoveredDay === event.detail.target) {
        hoveredDay.set(null);
        showPopover = false;
      }
    },
    250,
    true
  );

  const requestRefresh = debounce(() => {
    console.info("[Calendar] refreshing view");
    todayStore.set(window.moment());
  }, 350);

  const refreshMetadata = (
    _granularity: Granularity,
    _file: TFile,
    metadata: PeriodicNoteCachedMetadata
  ) => {
    if (metadata.date.isSame($displayedMonthStore, "month")) {
      requestRefresh();
    }
  };

  const updateActiveFile = (file: TFile | null) => {
    activeFile.set(file);
  };

  let unsubscribeFromCache: EventRef;
  let unsubscribeFromFileOpen: EventRef;
  onMount(() => {
    app.workspace.onLayoutReady(requestRefresh);
    unsubscribeFromCache = app.workspace.on(
      "periodic-notes:file-modified",
      refreshMetadata
    );
    unsubscribeFromFileOpen = app.workspace.on("file-open", updateActiveFile);
  });

  $: sourceColors = getSourceColors(sources, sourceSettings);

  onDestroy(() => {
    app.workspace.offref(unsubscribeFromCache);
    app.workspace.offref(unsubscribeFromFileOpen);
  });
</script>

<div id="calendar-container" class="container" style={sourceColors}>
  <Toolbar
    {app}
    {sources}
    {sourceSettings}
    {selectedSourceIds}
    on:changeSources={updateVisibleSources}
  />
  <div class="calendar-content">
    <Nav
      sources={visibleSources}
      {sourceSettings}
      {eventHandlers}
      on:hoverDay={updatePopover}
      on:endHoverDay={dismissPopover}
    />
    <table class="calendar">
      <colgroup>
        {#if showWeekNums}
          <col />
        {/if}
        {#each month[1].days as date}
          <col class:weekend={isWeekend(date)} />
        {/each}
      </colgroup>
      <thead>
        <tr>
          {#if showWeekNums}
            <th>W</th>
          {/if}
          {#each daysOfWeek as dayOfWeek}
            <th>{dayOfWeek}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each month as week (week.weekNum)}
          <tr>
            {#if showWeekNums}
              <WeekNum
                days={week.days}
                {eventHandlers}
                sources={visibleSources}
                {sourceSettings}
                weekNum={week.weekNum}
                on:hoverDay={updatePopover}
                on:endHoverDay={dismissPopover}
              />
            {/if}
            {#each week.days as day (day.format())}
              <Day
                date={day}
                sources={visibleSources}
                {sourceSettings}
                {eventHandlers}
                isActive={$activeFile &&
                  $activeFile ===
                    app.plugins
                      .getPlugin("periodic-notes")
                      .getPeriodicNote("day", day)}
                on:hoverDay={updatePopover}
                on:endHoverDay={dismissPopover}
              />
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <PopoverMenu
    referenceElement={$hoveredDay}
    metadata={popoverMetadata}
    isVisible={showPopover}
  />
</div>

<style>
  .container {
    --color-background-heading: transparent;
    --color-background-day: transparent;
    --color-background-weeknum: transparent;
    --color-background-weekend: transparent;

    --color-dot: var(--text-muted);
    --color-arrow: var(--text-muted);
    --color-button: var(--text-muted);

    --color-text-title: var(--text-normal);
    --color-text-heading: var(--text-muted);
    --color-text-day: var(--text-normal);
    --color-text-today: var(--interactive-accent);
    --color-text-weeknum: var(--text-muted);

    padding: 0 !important;
    overflow-x: hidden;
  }

  .calendar-content {
    padding: 0 12px;
  }

  .weekend {
    background-color: var(--color-background-weekend);
  }

  .calendar {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
  }

  th {
    background-color: var(--color-background-heading);
    color: var(--color-text-heading);
    font-size: 0.6em;
    letter-spacing: 1px;
    padding: 4px;
    text-align: center;
    text-transform: uppercase;
  }
</style>
