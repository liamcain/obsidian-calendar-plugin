<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import clickOutside from "./clickOutside";
  import Popper from "./Popper.svelte";

  import getColors, {
    getPaletteNames,
    getPaletteName,
    IColorSwatch,
  } from "./colors";

  export let highlighted: boolean;
  export let value: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const theme = (<any>window.app).customCss.theme;
  let activePalette = getPaletteName(theme);
  let swatches: IColorSwatch[][];

  $: swatches = getColors(activePalette);

  let referenceElement: HTMLElement;
  let isVisible: boolean = false;

  const dispatch = createEventDispatcher();

  function toggleOpen(event: MouseEvent) {
    isVisible = !isVisible;
    event.stopPropagation();
  }

  function close() {
    isVisible = false;
  }

  function selectSwatch(swatch: string) {
    value = swatch;
    dispatch("input", swatch);
    isVisible = false;
  }
</script>

<div
  bind:this={referenceElement}
  class="picker-btn"
  class:open={isVisible}
  class:highlighted
  style="background-color:{value}"
  on:click={toggleOpen}
  {value}
/>
{#if isVisible}
  <Popper {referenceElement} {isVisible} placement="bottom">
    <div class="picker" on:click|stopPropagation use:clickOutside={close}>
      {#each swatches as palette}
        <div class="palette">
          {#each palette as { value: hex, name }}
            <div class="opacity-grid">
              <div
                aria-label={name}
                class="swatch"
                class:selected={hex === value}
                style="background-color:{hex}"
                on:click|stopPropagation={() => selectSwatch(hex)}
              />
            </div>
          {/each}
        </div>
      {/each}
      <div class="palette-bottom-bar">
        <select class="dropdown palette-dropdown" bind:value={activePalette}>
          {#each getPaletteNames() as paletteOption}
            <option value={paletteOption}>{paletteOption} palette</option>
          {/each}
        </select>
        <input class="hex-input" type="text" bind:value />
      </div>
    </div>
  </Popper>
{/if}

<style>
  .palette-bottom-bar {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .palette-dropdown {
    background-color: var(--background-primary);
    font-size: 14px;
    padding: 0.3em 1.5em 0.3em 0.8em;
  }

  .hex-input {
    font-size: 14px;
    background-color: var(--background-primary);
    width: 100%;
  }

  .picker {
    background-color: var(--background-primary);
    border-radius: 8px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 290px;
    padding: 12px;
    z-index: var(--layer-popover);
  }

  .palette {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-direction: row;
  }

  .picker-btn {
    margin-left: auto;
  }

  .opacity-grid,
  .picker-btn,
  .swatch {
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    height: 24px;
    width: 24px;
  }

  .swatch {
    position: absolute;
  }

  .picker-btn:hover,
  .swatch:hover {
    border: 1px solid var(--text-muted);
  }

  .opacity-grid {
    background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
      linear-gradient(-45deg, #808080 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #808080 75%),
      linear-gradient(-45deg, transparent 75%, #808080 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
    border-radius: 12px;
    border: none;
    position: relative;
  }

  .swatch.selected,
  .picker-btn.open {
    border: 2px solid var(--text-normal);
  }

  .picker-btn.highlighted {
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.15);
  }
</style>
