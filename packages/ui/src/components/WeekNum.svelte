<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import { getDateUID } from "obsidian-daily-notes-interface";

  import Dot from "./Dot.svelte";
  import MetadataResolver from "./MetadataResolver.svelte";
  import type { IDayMetadata } from "../types";
  import { getStartOfWeek, isMetaPressed } from "../utils";

  // Properties
  export let weekNum: number;
  export let days: Moment[];
  export let metadata: Promise<IDayMetadata> | null;

  // Event handlers
  export let onHover: (
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ) => boolean;
  export let onClick: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onContextMenu: (date: Moment, event: MouseEvent) => boolean;

  // Global state;
  export let selectedId: string = null;

  let startOfWeek: Moment;
  $: startOfWeek = getStartOfWeek(days);
</script>

<td>
  <MetadataResolver metadata="{metadata}" let:metadata>
    <div
      class="{`week-num ${metadata.classes.join(' ')}`}"
      class:active="{selectedId === getDateUID(days[0], 'week')}"
      on:click="{onClick && ((e) => onClick(startOfWeek, isMetaPressed(e)))}"
      on:contextmenu="{onContextMenu && ((e) => onContextMenu(days[0], e))}"
      on:pointerover="{onHover &&
        ((e) => onHover(startOfWeek, e.target, isMetaPressed(e)))}"
    >
      {weekNum}
      <div class="dot-container">
        {#each metadata.dots as dot}
          <Dot {...dot} />
        {/each}
      </div>
    </div>
  </MetadataResolver>
</td>

<style>
  td {
    border-right: 1px solid var(--background-modifier-border);
  }

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
