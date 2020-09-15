<script lang="ts">
  import moment, { Moment } from "moment";
  import type { Leaf, Vault } from "./obsidian";

  export let activeLeaf: Leaf = null;
  export let vault: Vault;
  export let onClick: (event: Event) => void;

  export let directory: string;
  export let format: string;

  const today = moment();
  const activeFile = activeLeaf?.view.file?.path;
  export let displayedMonth: Moment = today;

  let days = [];
  let monthName: string;

  $: {
    days = [];
    const startDate = displayedMonth.clone().date(1);
    let offset = startDate.isoWeekday() + (1 % 7);
    let day = 1;

    for (let weekNum = 0; weekNum <= 5; weekNum++) {
      const daysInWeek = [];
      days.push(daysInWeek);

      for (let weekday = 1; weekday <= 7; weekday++) {
        // Insert empty objects for spacers
        if (weekNum * 6 + weekday < offset || day > startDate.daysInMonth()) {
          daysInWeek.push({});
          continue;
        }

        const { path } = vault.adapter;

        const date = displayedMonth.clone().date(day);
        const formattedDate = `${date.format(format)}.md`;
        const fileForDay = vault.getAbstractFileByPath(
          path.join(directory, formattedDate)
        );
        const fileSize = fileForDay?.stat?.size || 0;

        daysInWeek.push({
          dayOfMonth: day,
          date,
          formattedDate,
          numDots: fileSize ? Math.floor(Math.log(fileSize / 20)) : 0,
        });

        day++;
      }

      if (day >= startDate.daysInMonth()) {
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
</script>

<style>
  th,
  td {
    text-align: center;
  }

  .title {
    margin-right: 4px;
    text-align: center;
  }

  .today {
    background: var(--purple);
  }

  .arrow {
    cursor: pointer;
    display: inline-block;
  }
  .arrow svg {
    height: 16px;
    width: 16px;
  }

  .active {
    background: var(--red) !important;
    position: relative;
    z-index: 1;
  }

  .container {
    overflow-y: scroll;
    padding: 0 16px;
  }

  .table {
    border: solid 1px var(--dark0);
    border-collapse: collapse;
    width: 100%;
  }

  th {
    background-color: var(--dark0);
    padding: 8px;
  }

  td {
    cursor: pointer;
    border: solid 1px var(--dark0);
    font-size: 0.8em;
    padding: 8px;
  }
  td:empty {
    background-color: var(--dark2);
  }
  td:not(:empty):hover {
    background-color: var(--dark0);
  }

  .dot-container {
    line-height: 4px;
    zoom: 0.6;
  }

  .dot {
    border-radius: 100%;
    background: var(--frost2);
    width: 6px;
    height: 6px;
    display: inline-block;
    margin-right: 4px;
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
</style>

<div class="container">
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
    {monthName}
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
        <th>S</th>
        <th>M</th>
        <th>T</th>
        <th>W</th>
        <th>H</th>
        <th>F</th>
        <th>S</th>
      </tr>
    </thead>
    <tbody>
      {#each days as daysInWeek}
        <tr>
          {#each daysInWeek as { dayOfMonth, date, formattedDate, numDots }}
            {#if !dayOfMonth}
              <td />
            {:else}
              <td
                class:today={date.isSame(today)}
                class:active={activeFile === formattedDate}
                on:click={onClick}>
                {dayOfMonth}

                <div class="dot-container">
                  {#each Array(numDots) as _}
                    <div class="dot" />
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
