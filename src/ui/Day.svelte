<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

  import Dot from "./Dot.svelte";
  import { activeFile } from "./stores";
  import { CalendarSource, IDayMetadata, isMetaPressed } from "./utils";

  const { format } = getDailyNoteSettings();

  let isActive: boolean;
  let metadata: IDayMetadata;
  export let date: Moment;
  export let file: TFile;
  export let source: CalendarSource;

  export let onHover: (
    targetEl: EventTarget,
    filename: string,
    file: TFile
  ) => void;
  export let openOrCreateDailyNote: (
    date: Moment,
    existingFile: TFile,
    inNewSplit: boolean
  ) => void;
  export let displayedMonth: Moment;
  export let today: Moment;

  $: {
    isActive = $activeFile === file;
    metadata = source.getMetadata(date);
  }
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
</style>

<td>
  <div
    class="day"
    class:adjacent-month={!date.isSame(displayedMonth, 'month')}
    class:active={isActive}
    class:has-note={!!file}
    class:today={date.isSame(today, 'day')}
    on:click={(e) => {
      openOrCreateDailyNote(date, file, isMetaPressed(e));
    }}
    on:pointerover={(e) => {
      if (isMetaPressed(e)) {
        onHover(e.target, date.format(format), file);
      }
    }}>
    {date.format('D')}

    <div class="dot-container">
      {#await metadata.dots then dots}
        {#each dots as dot}
          <Dot {...dot} />
        {/each}
      {/await}
    </div>
  </div>
</td>
