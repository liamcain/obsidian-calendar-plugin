<script lang="ts">
  export let dragDisabled: boolean;
  export let startDrag: (ev: MouseEvent | TouchEvent) => void;
  export let handleKeyDown: (ev: KeyboardEvent) => void;
</script>

<div
  aria-label="Drag to rearrange"
  style={dragDisabled ? "cursor: grab" : "cursor: grabbing"}
  class="handle"
  on:mousedown={startDrag}
  on:touchstart={startDrag}
  on:keydown={handleKeyDown}
>
  <svg
    fill="none"
    height="32"
    viewBox="0 0 17 32"
    width="17"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="3.13232" cy="3.64536" r="3" fill="currentColor" />
    <circle cx="13.167" cy="3.64536" r="3" fill="currentColor" />
    <circle cx="3.13232" cy="15.8953" r="3" fill="currentColor" />
    <circle cx="13.167" cy="15.8953" r="3" fill="currentColor" />
    <circle cx="3.13232" cy="28.1452" r="3" fill="currentColor" />
    <circle cx="13.167" cy="28.1452" r="3" fill="currentColor" />
  </svg>
</div>

<style>
  .handle {
    color: var(--background-modifier-border);
    height: 16px;
    margin-right: 8px;
    width: 16px;
  }

  :global(.active) .handle {
    color: var(--text-accent-hover);
  }

  .handle svg {
    width: 16px;
    height: 16px;
  }
</style>
