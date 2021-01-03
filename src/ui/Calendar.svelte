<script lang="ts">
  import type { Moment } from "moment";
  import {
    Calendar as CalendarBase,
    ICalendarSource,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";

  import { activeFile, displayedMonth, settings } from "./stores";

  export let sources: ICalendarSource[];
  export let onHoverDay: (date: Moment, targetEl: EventTarget) => void;
  export let onHoverWeek: (date: Moment, targetEl: EventTarget) => void;
  export let onClickDay: (date: Moment, isMetaPressed: boolean) => void;
  export let onClickWeek: (date: Moment, isMetaPressed: boolean) => void;

  const moment = window.moment;
  let today = moment();

  export function tick() {
    today = moment();
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    const isViewingCurrentMonth = today.isSame($displayedMonth, "day");
    today = moment();

    if (isViewingCurrentMonth) {
      // if it's midnight on the last day of the month, this will
      // update the display to show the new month.
      displayedMonth.reset();
    }
  }, 1000 * 60);

  onDestroy(() => {
    clearInterval(heartbeat);
  });
</script>

<svelte:options immutable />
<CalendarBase
  {onHoverDay}
  {onHoverWeek}
  {onClickDay}
  {onClickWeek}
  {sources}
  {today}
  selectedId={$activeFile}
  displayedMonth={$displayedMonth}
  showWeekNums={$settings.showWeeklyNote}
/>
