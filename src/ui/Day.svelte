<script lang="ts">
  import type { Moment } from "moment";

  import { IDay, isMetaPressed } from "./utils";

  export let onHover: (targetEl: EventTarget, filepath: string) => void;
  export let openOrCreateDailyNote: (date: Moment, inNewSplit: boolean) => void;
  export let day: IDay;
  export let today: Moment;

  const {
    isActive,
    dayOfMonth,
    date,
    numTasksRemaining,
    numDots,
    notePath,
  } = day;
</script>

<style>
  .day {
    border-radius: 4px;
    height: 100%;
    text-align: center;
    vertical-align: baseline;
  }

  .today {
    color: var(--color-text-today);
  }

  .active,
  .active.today {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
  }

  .day {
    transition: background-color 0.1s ease-in, color 0.1s ease-in;
    background-color: var(--color-background-day);
    color: var(--color-text-day);
    cursor: pointer;
    font-size: 0.8em;
    padding: 8px;
  }
  .day:not(:empty):hover {
    background-color: var(--interactive-hover);
  }

  .day.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  .dot-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    line-height: 6px;
    min-height: 6px;
  }

  .dot,
  .task {
    display: inline-block;
    fill: var(--color-dot);
    height: 6px;
    width: 6px;
    margin: 0 1px;
  }
  .active .dot {
    fill: var(--text-on-accent);
  }

  .task {
    fill: none;
    stroke: var(--color-dot);
  }

  .active .task {
    stroke: var(--text-on-accent);
  }
</style>

<td>
  <div
    class="day"
    class:active={isActive}
    class:today={date.isSame(today)}
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
      {#await numDots then dots}
        {#each Array(dots) as _}
          <svg class="dot" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
            <circle cx="3" cy="3" r="2" />
          </svg>
        {/each}
      {/await}
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
  </div>
</td>
