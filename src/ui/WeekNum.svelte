<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import type { IDailyNote } from "obsidian-daily-notes-interface";

  import { getWeeklyNoteSettings, ISettings } from "src/settings";

  import Dot from "./Dot.svelte";
  import { getStartOfWeek, IDayMetadata, isMetaPressed } from "./utils";

  export let weeklyNote: TFile;
  export let weekNum: number;
  export let days: IDailyNote[];

  export let activeFile: string;
  export let metadata: IDayMetadata;
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

  const { format } = getWeeklyNoteSettings(settings);

  let startOfWeek: Moment;
  let formattedDate: string;
  let isActive: boolean;

  $: isActive = activeFile && weeklyNote?.basename === activeFile;
  $: startOfWeek = getStartOfWeek(days, weekNum);
  $: formattedDate = startOfWeek.format(format);
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
      {#await metadata.dots then dots}
        {#each dots as dot}
          <Dot {...dot} />
        {/each}
      {/await}
    </div>
  </div>
</td>
