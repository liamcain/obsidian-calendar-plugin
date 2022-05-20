<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import { dndzone, TRIGGERS } from "svelte-dnd-action";

  import type { ISettings } from "src/settings";

  import DragHandle from "./DragHandle.svelte";
  import Picker from "./palette/Picker.svelte";
  import type { ICalendarSource } from "../types";

  export let settings: Writable<ISettings>;
  export let registeredSources: ICalendarSource[];

  const flipDurationMs = 100;
  let dragDisabled = true;

  // function refreshItems() {
  //   const allItems = $sources
  //     .map(getSourceSettings)
  //     .sort((a, b) => a.order - b.order);
  //   [enabledItems, disabledItems] = partition(
  //     allItems,
  //     (item) => item.display !== "none"
  //   );
  // }

  // function getSourceSettings(source) {
  //   return {
  //     ...source,
  //     ...(source.defaultSettings || {}),
  //     ...settings.getSourceSettings(source.id),
  //   };
  // }

  // function handleConsider(event) {
  //   enabledItems = event.detail.items;
  //   if (event.detail.info.trigger === TRIGGERS.DRAG_STOPPED) {
  //     dragDisabled = true;
  //   }
  // }

  // function handleFinalize(event) {
  //   enabledItems = event.detail.items;
  //   dragDisabled = true;
  //   saveAllSourceSettings($items);
  // }

  function startDrag(e: DragEvent) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }

  function handleKeyDown(e) {
    if ((e.key === "Enter" || e.key === " ") && dragDisabled)
      dragDisabled = false;
  }

  // function handleTeardown() {
  //   activeItemId = null;
  // }

  // function setActiveItem(item) {
  // activeItemId = item.id;
  // const source = $sources.find((s) => s.id === item.id);
  // const saveSource = (sourceSettings) =>
  //   writeSettingsToDisk((existingSettings) => {
  //     const newSettings = {
  //       ...existingSettings,
  //       sourceSettings: {
  //         ...existingSettings.sourceSettings,
  //         [item.id]: {
  //           ...existingSettings.sourceSettings[item.id],
  //           ...sourceSettings,
  //         },
  //       },
  //     };

  //     item.display = sourceSettings.display;
  //     refreshItems();

  //     settings.set(newSettings);
  //     return newSettings;
  //   });

  // new SourceSettingsModal(
  //   window.app,
  //   source,
  //   saveSource,
  //   handleTeardown
  // ).open();
  // }
</script>

<div class="container">
  <div class="layout-grid">
    {#each registeredSources as source}
      <div class="calendar-source">
        <DragHandle {dragDisabled} {startDrag} {handleKeyDown} />
        <Picker bind:value={$settings.sourceSettings[source.id].color} />
        <div class="source-info">
          <div class="source-name">
            {source.name}
          </div>
          <div class="source-description setting-item-description">
            {source.description}
          </div>
        </div>
        <input
          class="source-toggle"
          type="checkbox"
          bind:checked={$settings.sourceSettings[source.id].enabled}
        />
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .container {
    border-top: 1px solid var(--background-modifier-border);
    display: flex;
    display: grid;
    gap: 24px;
    margin: 8px 0;
    padding-top: 8px;
    width: 100%;
  }

  .layout-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .calendar-source {
    transition: border-color 0.1s ease-in-out;
    align-items: center;
    cursor: pointer;
    background-color: var(--background-primaryAlt);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    display: flex;
    font-size: 14px;
    margin: 4px 0;
    padding: 12px;
    width: 100%;

    &:hover {
      border-color: var(--interactive-accent);
    }
  }

  .source-toggle {
    margin-left: auto;
    transform: scale(1.4) translateX(-4px);
  }
</style>
