<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { IColorSwatch } from "./colors";
  import getColors, { getPaletteNames, getPaletteName } from "./colors";

  export let close: () => void;
  export let value: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const theme = (<any>window.app).customCss.theme;
  let activePalette = getPaletteName(theme);
  let swatches: IColorSwatch[][];

  $: swatches = getColors(activePalette);

  const dispatch = createEventDispatcher();

  function selectSwatch(swatch: string) {
    value = swatch;
    dispatch("input", swatch);
    close();
  }
</script>

<div class="container">
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

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

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

  .palette {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-direction: row;
  }

  :global(.is-mobile) .palette {
    gap: 12px;
  }

  .opacity-grid,
  .swatch {
    border: 1px solid var(--background-modifier-border);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    height: 24px;
    width: 24px;
  }

  :global(.is-mobile) .opacity-grid,
  :global(.is-mobile) .swatch {
    height: 36px;
    width: 36px;
  }

  .swatch {
    position: absolute;

    &:hover {
      border: 1px solid var(--text-muted);
    }
    &.selected {
      border: 2px solid var(--text-normal);
    }
  }

  .opacity-grid {
    background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
      linear-gradient(-45deg, #808080 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #808080 75%),
      linear-gradient(-45deg, transparent 75%, #808080 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
    border-radius: 50%;
    border: none;
    position: relative;
  }
</style>
