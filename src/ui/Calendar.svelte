<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import {
    Calendar as CalendarBase,
    ICalendarSource,
    configureGlobalMomentLocale,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";

  import type { ISettings } from "src/settings";
  import { activeFile, dailyNotes, settings, weeklyNotes, selectedDate } from "./stores";
  import EventList from "./EventList.svelte";
  import { eventsStore } from "src/events/store";
  import { startNotifier } from "src/events/notifier";

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

  // Agenda: lista segue hoje por padrão, mas borda só aparece após clique explícito (via selectedDateSource)
  $: selectedDateStr = $selectedDate ?? today.format("YYYY-MM-DD");

  // força re-render do calendário quando muda o dia selecionado (borda)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  $: void $selectedDate;

  function handleClickDay(date: Moment, isMetaPressed: boolean) {
    const str = date.format("YYYY-MM-DD");
    selectedDate.set(str);
    return onClickDay(date, isMetaPressed);
  }

  function handleDragOver(e: DragEvent) {
    const target = (e.target as HTMLElement)?.closest?.("[data-date]") as HTMLElement | null;
    if (target) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      target.classList.add("drag-over");
    }
  }
  function handleDragLeave(e: DragEvent) {
    const target = (e.target as HTMLElement)?.closest?.("[data-date]") as HTMLElement | null;
    if (target) target.classList.remove("drag-over");
  }

  function handleDrop(e: DragEvent) {
    const target = (e.target as HTMLElement)?.closest?.("[data-date]") as HTMLElement | null;
    if (!target) return;
    e.preventDefault();
    target.classList.remove("drag-over");
    const toDate = target.getAttribute("data-date");
    if (!toDate || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) return;
    let payload: { id: string; fromDate: string } | null = null;
    try {
      payload = JSON.parse(e.dataTransfer?.getData("text/plain") || "");
    } catch {
      // fallback: text/calendar-event
      try { payload = JSON.parse(e.dataTransfer?.getData("text/calendar-event") || ""); } catch { /* ignore */ }
    }
    if (!payload?.id || !payload?.fromDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.fromDate)) return;
    if (typeof payload.id !== "string" || payload.id.length > 100) return;
    if (payload.fromDate === toDate) return;
    eventsStore.moveEvent(payload.id, payload.fromDate, toDate);
    selectedDate.set(toDate);
    tick();
  }

  export function tick() {
    today = window.moment();
    // força reatividade do eventsSource (dots) ao mudar eventsStore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = $eventsStore;
  }

  // inicia notifier quando componente monta
  let stopNotifier: (() => void) | null = null;
  $: if ($settings.enableEventNotifications && !stopNotifier) {
    stopNotifier = startNotifier();
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

  onDestroy(() => {
    clearInterval(heartbeat);
    if (stopNotifier) stopNotifier();
  });
</script>

<div on:dragover={handleDragOver} on:dragleave={handleDragLeave} on:drop={handleDrop}>
  <CalendarBase
    {sources}
    {today}
    {onHoverDay}
    {onHoverWeek}
    {onContextMenuDay}
    {onContextMenuWeek}
    onClickDay={handleClickDay}
    {onClickWeek}
    bind:displayedMonth
    localeData={today.localeData()}
    selectedId={$activeFile}
    showWeekNums={$settings.showWeeklyNote}
  />
</div>

<!-- Agenda: lista de eventos do dia selecionado, segue tema Obsidian -->
<div class="calendar-agenda-wrapper">
  <EventList dateStr={selectedDateStr} />
</div>
