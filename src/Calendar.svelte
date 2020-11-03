<script lang="ts">
  import type { TFile, Vault } from "obsidian";
  import { onDestroy } from "svelte";

  import { normalizedJoin } from "./path";
  import { getDateFormat, getNoteFolder, SettingsInstance } from "./settings";
  import type { IMoment } from "./template";
  import { getNumberOfDots } from "./ui/utils";

  export let activeFile: string = null;
  export let vault: Vault;
  export let displayedMonth: IMoment;
  export let openOrCreateDailyNote: (filename: string) => void;

  const moment = (window as any).moment;

  let month = [];
  let monthName: string;
  let daysOfWeek = moment.weekdaysShort();
  let today = moment();
  displayedMonth = today.clone();

  let settings = null;
  let settingsUnsubscribe = SettingsInstance.subscribe((value) => {
    settings = value;
  });

  $: {
    month = [];
    const startDate = displayedMonth.clone().date(1);
    const endDayOfMonth = startDate.daysInMonth();
    const startOffset = settings.shouldStartWeekOnMonday
      ? startDate.isoWeekday()
      : (startDate.isoWeekday() + 1) % 7;

    if (settings.shouldStartWeekOnMonday) {
      const [sunday, ...restOfWeek] = moment.weekdaysShort();
      daysOfWeek = [...restOfWeek, sunday];
    }

    let dayOfMonth = 1;
    for (let weekNum = 0; weekNum <= 5; weekNum++) {
      const week = [];
      month.push(week);

      for (let weekday = 1; weekday <= 7; weekday++) {
        // Insert empty objects for spacers
        if (weekNum * 6 + weekday < startOffset || dayOfMonth > endDayOfMonth) {
          week.push({});
          continue;
        }

        const date: IMoment = displayedMonth.clone().date(dayOfMonth);
        const formattedDate = date.format(getDateFormat(settings));
        const fileForDay = vault.getAbstractFileByPath(
          normalizedJoin(getNoteFolder(settings), `${formattedDate}.md`)
        ) as TFile;

        week.push({
          date,
          dayOfMonth,
          formattedDate,
          numDots: getNumberOfDots(fileForDay),
        });

        dayOfMonth++;
      }

      if (dayOfMonth > startDate.daysInMonth()) {
        break;
      }
    }

    monthName = displayedMonth.format("MMM YYYY");
  }

  function incrementMonth() {
    displayedMonth = displayedMonth.add(1, "months");
  }

  function decrementMonth() {
    displayedMonth = displayedMonth.subtract(1, "months");
  }

  function focusCurrentMonth() {
    displayedMonth = today.clone();
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    const isViewingCurrentMonth = today.isSame(displayedMonth);
    today = (window as any).moment();

    if (isViewingCurrentMonth) {
      // if it's midnight on the last day of the month, this will
      // update the display to show the new month.
      displayedMonth = today.clone();
    }
  }, 1000 * 60);

  onDestroy(() => {
    settingsUnsubscribe();
    clearInterval(heartbeat);
  });
</script>

<style>
  .container {
    --color-background-heading: transparent;

    --color-background-day: transparent;
    --color-background-day-empty: var(--background-secondary-alt);
    --color-background-day-active: var(--interactive-accent);
    --color-background-day-hover: var(--interactive-hover);

    --color-dot: var(--text-muted);
    --color-arrow: currentColor;

    --color-text-title: var(--text-normal);
    --color-text-heading: var(--text-normal);
    --color-text-day: var(--text-normal);
    --color-text-today: var(--text-accent);
  }

  .container {
    margin-bottom: 24px;
    overflow-y: auto;
    padding: 0 16px;
  }

  th,
  td {
    text-align: center;
  }

  .title {
    color: var(--color-text-title);
    margin-right: 4px;
    text-align: center;
  }

  .today {
    color: var(--color-text-today);
  }

  .active {
    background-color: var(--color-background-day-active);
  }

  .table {
    border-collapse: collapse;
    width: 100%;
  }

  th {
    background-color: var(--color-background-heading);
    color: var(--color-text-heading);
    font-size: 0.6rem;
    letter-spacing: 1px;
    padding: 4px 8px;
    text-transform: uppercase;
  }

  td {
    transition: background-color 0.1s ease-in;
    background-color: var(--color-background-day);
    color: var(--color-text-day);
    cursor: pointer;
    font-size: 0.8em;
    padding: 8px;
  }
  td:empty {
    background-color: var(--color-background-day-empty);
  }
  td:not(:empty):hover {
    background-color: var(--color-background-day-hover);
  }

  .dot-container {
    height: 6px;
    line-height: 6px;
  }

  .dot {
    display: inline-block;
    fill: var(--color-dot);
    height: 6px;
    width: 6px;
    margin-right: 2px;
  }

  .dot:last-of-type {
    margin-right: 0;
  }

  .ml-2 {
    margin-left: 8px;
  }

  .mr-2 {
    margin-right: 8px;
  }

  .arrow {
    cursor: pointer;
    display: inline-block;
  }
  .arrow svg {
    fill: var(--color-arrow);
    height: 16px;
    width: 16px;
  }
</style>

<div id="calendar-container" class="container">
  <h2 class="title">
    <div
      class="arrow mr-2"
      on:click={decrementMonth}
      aria-label="Previous Month">
      <svg
        class="arrow"
        focusable="false"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 512"><path
          fill="currentColor"
          d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z" /></svg>
    </div>
    <span on:click={focusCurrentMonth}>{monthName}</span>
    <div class="arrow ml-2" on:click={incrementMonth} aria-label="Next Month">
      <svg
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 512"><path
          fill="currentColor"
          d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" /></svg>
    </div>
  </h2>
  <table class="table">
    <thead>
      <tr>
        {#each daysOfWeek as dayOfWeek}
          <th>{dayOfWeek}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each month as week}
        <tr>
          {#each week as { dayOfMonth, date, formattedDate, numDots }}
            {#if !dayOfMonth}
              <td />
            {:else}
              <td
                class:today={date.isSame(today)}
                class:active={activeFile === formattedDate}
                on:click={() => {
                  openOrCreateDailyNote(date);
                }}>
                {dayOfMonth}

                <div class="dot-container">
                  {#each Array(numDots) as _}
                    <svg
                      class="dot"
                      viewBox="0 0 6 6"
                      xmlns="http://www.w3.org/2000/svg">
                      <circle cx="3" cy="3" r="2" />
                    </svg>
                  {/each}
                </div>
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
