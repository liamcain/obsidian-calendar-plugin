<script lang="ts">
  import type { Moment } from "moment";
  import { onDestroy } from "svelte";
  import { get } from "svelte/store";

  import Day from "./Day.svelte";
  // import WeekNum from "./WeekNum.svelte";
  import { dailyNotes, displayedMonth, settings } from "./stores";
  import type { CalendarSource } from "./sources/CalendarSource";
  import { getMonthData, getDaysOfWeek, IMonth, isWeekend } from "./utils";

  const moment = window.moment;

  export let source: CalendarSource;

  export let onHover: (date: Moment, targetEl: EventTarget) => void;
  export let onClick: (date: Moment, isMetaPressed: boolean) => void;

  // export let openOrCreateWeeklyNote: (
  //   date: Moment,
  //   existingFile: TFile,
  //   inNewSplit: boolean
  // ) => void;

  let month: IMonth;
  let daysOfWeek: string[];

  let today = moment();

  // Get the word 'Today' but localized to the current language
  const todayDisplayStr = today.calendar().split(/\d|\s/)[0];
  month = getMonthData($displayedMonth);
  $: daysOfWeek = getDaysOfWeek($settings);

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    const isViewingCurrentMonth = today.isSame(get(displayedMonth), "day");
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
  }

  .container {
    padding: 0 8px;
  }

  th {
    text-align: center;
  }

  .nav {
    align-items: center;
    display: flex;
    margin: 0.6em 0 1em;
    padding: 0 8px;
    width: 100%;
  }

  .title {
    color: var(--color-text-title);
    font-size: 1.5em;
    margin: 0;
  }

  .month {
    font-weight: 500;
    text-transform: capitalize;
  }

  .year {
    color: var(--interactive-accent);
  }

  .right-nav {
    display: flex;
    justify-content: center;
    margin-left: auto;
  }

  .reset-button {
    border-radius: 4px;
    color: var(--text-muted);
    font-size: 0.7em;
    font-weight: 600;
    letter-spacing: 1px;
    margin: 0 4px;
    padding: 0px 4px;
    text-transform: uppercase;
  }

  .weekend {
    background-color: var(--color-background-weekend);
  }

  .calendar {
    border-collapse: collapse;
    width: 100%;
  }

  th {
    background-color: var(--color-background-heading);
    color: var(--color-text-heading);
    font-size: 0.6em;
    letter-spacing: 1px;
    padding: 4px 8px;
    text-transform: uppercase;
  }

  .arrow {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    width: 24px;
  }

  .arrow svg {
    color: var(--color-arrow);
    height: 16px;
    width: 16px;
  }
</style>

<svelte:options immutable />
<div id="calendar-container" class="container">
  <div class="nav">
    <h3 class="title" on:click={displayedMonth.reset}>
      <span class="month">{$displayedMonth.format('MMM')}</span>
      <span class="year">{$displayedMonth.format('YYYY')}</span>
    </h3>
    <div class="right-nav">
      <div
        class="arrow"
        on:click={displayedMonth.decrement}
        aria-label="Previous Month">
        <svg
          focusable="false"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 320 512"><path
            fill="currentColor"
            d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z" /></svg>
      </div>
      <div class="reset-button" on:click={displayedMonth.reset}>
        {todayDisplayStr}
      </div>
      <div
        class="arrow"
        on:click={displayedMonth.increment}
        aria-label="Next Month">
        <svg
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 320 512"><path
            fill="currentColor"
            d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" /></svg>
      </div>
    </div>
  </div>
  <table class="calendar">
    <colgroup>
      {#if $settings.showWeeklyNote}
        <col />
      {/if}
      {#each month[1].days as date}
        <col class:weekend={isWeekend(date)} />
      {/each}
    </colgroup>
    <thead>
      <tr>
        {#if $settings.showWeeklyNote}
          <th>W</th>
        {/if}
        {#each daysOfWeek as dayOfWeek}
          <th>{dayOfWeek}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each month as week}
        <tr>
          {#each week.days as date (date.format())}
            <Day {date} {onHover} {onClick} {source} {today} />
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
