<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import {
    Calendar as CalendarBase,
    MetadataStore,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";
  import { get } from "svelte/store";

  import { displayedMonth, settings } from "./stores";

  export let metadata: MetadataStore;
  export let onHoverDay: (date: Moment, targetEl: EventTarget) => void;
  export let onHoverWeek: (date: Moment, targetEl: EventTarget) => void;
  export let onClickDay: (date: Moment, isMetaPressed: boolean) => void;
  export let onClickWeek: (date: Moment, isMetaPressed: boolean) => void;
  export let onContextMenuDay: (event: MouseEvent, file: TFile) => void;
  export let today = window.moment();

  // Clock-tick to rerender the view
  export function tick() {
    today = window.moment();
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    const isViewingCurrentMonth = today.isSame(get(displayedMonth), "day");
    today = window.moment();

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
  {onContextMenuDay}
  {today}
  {metadata}
  showWeekNums={$settings.showWeeklyNote}
/>
