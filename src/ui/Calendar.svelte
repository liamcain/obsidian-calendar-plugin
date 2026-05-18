<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import {
    Calendar as CalendarBase,
    ICalendarSource,
    configureGlobalMomentLocale,
  } from "obsidian-calendar-ui";
  import { onDestroy, onMount } from "svelte";

  import type { ISettings } from "src/settings";
  import { activeFile, dailyNotes, settings, weeklyNotes } from "./stores";
  import { JumpToDateModal } from "./modal";

  let today: Moment;

  $: today = getToday($settings);

  export let displayedMonth: Moment = today;
  export let sources: ICalendarSource[];
  export let onHoverDay: (date: Moment, targetEl: EventTarget) => boolean;
  export let onHoverWeek: (date: Moment, targetEl: EventTarget) => boolean;
  export let onClickDay: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickWeek: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onContextMenuDay: (date: Moment, event: MouseEvent) => boolean;
  export let onContextMenuWeek: (date: Moment, event: MouseEvent) => boolean;

  export function tick() {
    today = window.moment();
  }

  function getToday(settings: ISettings) {
    configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
    dailyNotes.reindex();
    weeklyNotes.reindex();
    return window.moment();
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    tick();

    const isViewingCurrentMonth = displayedMonth.isSame(today, "day");
    if (isViewingCurrentMonth) {
      // if it's midnight on the last day of the month, this will
      // update the display to show the new month.
      displayedMonth = today;
    }
  }, 1000 * 60);

  let containerEl: HTMLDivElement;

  // Delegated listener: matches `.title` regardless of whether the upstream
  // `obsidian-calendar-ui` recreates the title element across re-renders.
  function onContainerClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    const titleEl = target?.closest(".title");
    if (!titleEl || !containerEl.contains(titleEl)) {
      return;
    }
    new JumpToDateModal(window.app, displayedMonth, (newMonth) => {
      displayedMonth = newMonth;
    }).open();
  }

  onMount(() => {
    containerEl.addEventListener("click", onContainerClick);
    containerEl
      .querySelectorAll(".title")
      .forEach((el) => el.classList.add("calendar-nav-title"));
  });

  onDestroy(() => {
    clearInterval(heartbeat);
    if (containerEl) {
      containerEl.removeEventListener("click", onContainerClick);
    }
  });
</script>

<div bind:this={containerEl}>
  <CalendarBase
    {sources}
    {today}
    {onHoverDay}
    {onHoverWeek}
    {onContextMenuDay}
    {onContextMenuWeek}
    {onClickDay}
    {onClickWeek}
    bind:displayedMonth
    localeData={today.localeData()}
    selectedId={$activeFile}
    showWeekNums={$settings.showWeeklyNote}
  />
</div>
