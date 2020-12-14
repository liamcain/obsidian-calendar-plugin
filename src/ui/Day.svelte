<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

  import { isMetaPressed } from "./utils";

  const { format } = getDailyNoteSettings();

  export let isActive: boolean;
  export let date: Moment;
  export let note: TFile;
  export let numTasksRemaining: Promise<number>;
  export let numDots: Promise<number>;
  export let tags: string[];

  export let onHover: (
    targetEl: EventTarget,
    filename: string,
    note: TFile
  ) => void;
  export let openOrCreateDailyNote: (
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ) => void;
  export let displayedMonth: Moment;
  export let today: Moment;
</script>

<style>
  .day {
    background-color: var(--color-background-day);
    border-radius: 4px;
    color: var(--color-text-day);
    cursor: pointer;
    font-size: 0.8em;
    height: 100%;
    padding: 4px;
    position: relative;
    text-align: center;
    transition: background-color 0.1s ease-in, color 0.1s ease-in;
    vertical-align: baseline;
  }
  .day:hover {
    background-color: var(--interactive-hover);
  }

  .day.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  .adjacent-month {
    opacity: 0.25;
  }

  .today {
    color: var(--color-text-today);
  }

  .active,
  .active.today {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
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
    class={`day ${tags.join(' ')}`}
    class:adjacent-month={!date.isSame(displayedMonth, 'month')}
    class:active={isActive}
    class:has-note={!!note}
    class:today={date.isSame(today, 'day')}
    on:click={(e) => {
      openOrCreateDailyNote(date, note, isMetaPressed(e));
    }}
    on:pointerover={(e) => {
      if (isMetaPressed(e)) {
        onHover(e.target, date.format(format), note);
      }
    }}>
    {date.format('D')}

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
