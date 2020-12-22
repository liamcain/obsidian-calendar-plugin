<script lang="ts">
  import type { Moment } from "moment";

  import Dot from "./Dot.svelte";
  import type { IWeekMetadata } from "./sources/CalendarSource";
  import { getStartOfWeek, isMetaPressed } from "./utils";

  export let weekNum: number;
  export let days: Moment[];
  export let metadata: IWeekMetadata;

  export let onHover: (date: Moment, targetEl: EventTarget) => void;
  export let onClick: (date: Moment, isMetaPressed: boolean) => void;

  let startOfWeek: Moment;
  let isActive: boolean;

  // $: isActive = $activeFile && weeklyNote === $activeFile;
  $: startOfWeek = getStartOfWeek(days);
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

<svelte:options immutable />
<td>
  <div
    class="week-num"
    class:active={isActive}
    on:click={(e) => {
      onClick(startOfWeek, isMetaPressed(e));
    }}
    on:pointerover={(e) => {
      if (isMetaPressed(e)) {
        onHover(startOfWeek, e.target);
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
