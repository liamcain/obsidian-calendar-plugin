<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { ICalendarSource } from "src/types";

  export let sources: ICalendarSource[] = [];
  export let selectedSourceIds: string[];

  const dispatch = createEventDispatcher();

  function handleClick(e: MouseEvent, sourceId: string | null) {
    dispatch("changeSources", {
      sourceId,
      isolated: e.shiftKey,
    });
  }
</script>

<div class="sources-list">
  {#each sources as source}
    <div
      class="source-tag"
      class:active={selectedSourceIds.includes(source.id)}
      style={`--source-color: var(--calendar-source-${source.id})`}
      tabindex="0"
      on:click={(e) => handleClick(e, source.id)}
    >
      {source.name}
    </div>
  {/each}
</div>

<style lang="scss">
  .sources-list {
    display: flex;
    gap: 4px;

    margin-left: auto;
    padding-right: 24px;
    overflow-x: auto;

    margin-bottom: -12px;
    padding-bottom: 12px;
  }

  .source-tag {
    align-items: center;
    background-color: var(--background-secondary);
    border-radius: 12px;
    border: 1px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    font-size: 0.6em;
    font-weight: 600;
    letter-spacing: 0.4px;
    line-height: 18px;
    padding: 0 10px;
    transition: border-color 0.1s ease-in-out, color 0.1s ease-in-out;
    white-space: nowrap;

    &:hover,
    &:focus {
      color: var(--interactive-accent);
    }

    &.active {
      background-color: var(--interactive-accent);
      border-color: var(--source-color);
      color: var(--text-on-accent);
    }
  }
</style>
