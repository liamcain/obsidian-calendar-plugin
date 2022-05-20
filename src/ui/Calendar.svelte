<script lang="ts">
  import type { Moment } from "moment";
  import type {
    ICalendarSource,
    CalendarEventHandlers,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";

  import CalendarPlugin from "src/main";
  import type { ISettings } from "src/settings";
  import type { ICalendarViewState } from "src/view";
  import CalendarView from "src/view";

  import CalendarBase from "./components/Calendar.svelte";

  export let eventHandlers: CalendarEventHandlers;
  export let plugin: CalendarPlugin;
  export let sources: ICalendarSource[];
  export let persistedViewState: ICalendarViewState;

  let today: Moment;
  let displayedMonth: Moment = persistedViewState.displayedMonth;
  let settings = plugin.settings;
  let isISO = plugin.shouldUseISOWeekNumbers();
  let enabledSources: ICalendarSource[];

  $: today = getToday($settings);
  $: enabledSources = sources
    .filter((source) => $settings.sourceSettings[source.id].enabled)
    .sort(
      (a, b) =>
        $settings.sourceSettings[a.id].order -
        $settings.sourceSettings[b.id].order
    );

  $: {
    if (!displayedMonth) {
      displayedMonth = today;
    }
  }

  export function tick() {
    today = window.moment();
  }

  function getToday(_settings: ISettings) {
    // configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
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

  // let calendarEl: HTMLElement;
  // onMount(() => {
  //   new CalendarBase({
  //     target: calendarEl,
  //     props: {
  //       app: plugin.app,
  //       displayedMonth,
  //       isISO,
  //       today,
  //       eventHandlers,
  //       localeData: today.localeData(),
  //       showWeekNums: $settings.showWeeklyNote,
  //       sources,
  //       sourceSettings: $settings.sourceSettings,
  //     },
  //   });
  // });

  onDestroy(() => {
    clearInterval(heartbeat);
  });
</script>

<!-- getSourceSettings={settings.getSourceSettings} -->

<CalendarBase
  app={plugin.app}
  {displayedMonth}
  {isISO}
  {today}
  {eventHandlers}
  {persistedViewState}
  localeData={today.localeData()}
  showWeekNums={$settings.showWeeklyNote}
  sources={enabledSources}
  sourceSettings={$settings.sourceSettings}
/>
