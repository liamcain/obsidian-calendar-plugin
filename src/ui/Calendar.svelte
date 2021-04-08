<script lang="ts">
  import type { Moment } from "moment";
  import type { App } from "obsidian";
  import {
    Calendar as CalendarBase,
    configureGlobalMomentLocale,
    ISourceSettings,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";

  import type { ISettings } from "src/settings";

  import { activeFile, settings, sources } from "./stores";

  let today: Moment;
  $: today = getToday($settings);

  export let app: App;
  export let displayedMonth: Moment = today;
  export let eventHandlers: CallableFunction[];

  export function tick() {
    today = window.moment();
  }

  function getToday(settings: ISettings) {
    configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
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
  });
</script>

<CalendarBase
  {app}
  sources={$sources}
  getSourceSettings={settings.getSourceSettings}
  {today}
  {eventHandlers}
  bind:displayedMonth
  localeData={today.localeData()}
  selectedId={$activeFile}
  showWeekNums={$settings.showWeeklyNote}
/>
