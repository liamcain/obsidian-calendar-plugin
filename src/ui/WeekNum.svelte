<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";

  import { getWeeklyNoteSettings, ISettings } from "src/settings";

  import {
    getNumberOfDots,
    getNumberOfRemainingTasks,
    IDay,
    isMetaPressed,
  } from "./utils";

  export let weeklyNote: TFile;
  export let weekNum: number;
  export let days: IDay[];

  export let activeFile: string;
  export let settings: ISettings;

  export let onHover: (
    targetEl: EventTarget,
    filename: string,
    note: TFile
  ) => void;
  export let openOrCreateWeeklyNote: (
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ) => void;

  let isActive: boolean;

  const startOfWeek = days[0].date.weekday(0);
  const { format } = getWeeklyNoteSettings(settings);
  const formattedDate = startOfWeek.format(format);

  $: isActive = activeFile && weeklyNote?.basename === activeFile;
</script>

<style>
  .week-num {
    background-color: var(--color-background-weeknum);
    border-radius: 4px;
    color: var(--color-text-weeknum);
    cursor: pointer;
    font-size: 0.65em;
    height: 100%;
    padding: 4px;
    text-align: center;
    transition: background-color 0.1s ease-in, color 0.1s ease-in;
    vertical-align: baseline;
  }

  td {
    border-right: 1px solid var(--background-modifier-border);
  }

  .week-num:hover {
    background-color: var(--interactive-hover);
  }

  .week-num.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  .active {
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
    class="week-num"
    class:active={isActive}
    on:click={(e) => {
      openOrCreateWeeklyNote(startOfWeek, weeklyNote, isMetaPressed(e));
    }}
    on:pointerover={(e) => {
      if (isMetaPressed(e)) {
        onHover(e.target, formattedDate, weeklyNote);
      }
    }}>
    {weekNum}

    <div class="dot-container">
      {#await getNumberOfDots(weeklyNote, settings) then dots}
        {#each Array(dots) as _}
          <svg class="dot" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
            <circle cx="3" cy="3" r="2" />
          </svg>
        {/each}
      {/await}
      {#await getNumberOfRemainingTasks(weeklyNote) then hasTask}
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
