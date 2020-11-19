<script lang="ts">
  import type { Moment } from "moment";

  import { IDay, isMetaPressed } from "./utils";

  export let activeFile: string = null;
  export let onHover: (targetEl: EventTarget, filepath: string) => void;
  export let openOrCreateDailyNote: (date: Moment, inNewSplit: boolean) => void;
  export let day: IDay;
  export let today: Moment;

  const {
    dayOfMonth,
    date,
    formattedDate,
    numTasksRemaining,
    numDots,
    notePath,
  } = day;
</script>

<style>
  td {
    border-radius: 4px;
    height: 100%;
    text-align: center;
    vertical-align: baseline;
  }

  .today {
    color: var(--color-text-today);
  }

  .active {
    background-color: var(--color-background-day-active);
  }

  .active.today {
    color: var(--color-text-today-active);
  }

  td {
    transition: background-color 0.1s ease-in;
    background-color: var(--color-background-day);
    color: var(--color-text-day);
    cursor: pointer;
    font-size: 0.8em;
    padding: 8px;
  }
  td:not(:empty):hover {
    background-color: var(--color-background-day-hover);
  }

  .dot-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    line-height: 6px;
  }

  .dot,
  .task {
    display: inline-block;
    fill: var(--color-dot);
    height: 6px;
    width: 6px;
    margin: 0 1px;
  }

  .task {
    fill: none;
    stroke: var(--color-dot);
  }
</style>

<td
  class:today={date.isSame(today)}
  class:active={activeFile === formattedDate}
  on:click={(e) => {
    openOrCreateDailyNote(date, isMetaPressed(e));
  }}
  on:pointerover={(e) => {
    if (isMetaPressed(e)) {
      onHover(e.target, notePath);
    }
  }}>
  {dayOfMonth}

  <div class="dot-container">
    {#each Array(numDots) as _}
      <svg class="dot" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
        <circle cx="3" cy="3" r="2" />
      </svg>
    {/each}
    {#await numTasksRemaining then hasTask}
      {#if hasTask}
        <svg
          class="task"
          viewBox="0 0 6 6"
          xmlns="http://www.w3.org/2000/svg"><circle
            cx="3"
            cy="3"
            r="2" /></svg>
      {/if}
    {/await}
  </div>
</td>
