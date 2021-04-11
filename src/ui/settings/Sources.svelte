<script>
  import { debounce } from "obsidian";

  import { writable } from "svelte/store";
  import { dndzone, TRIGGERS } from "svelte-dnd-action";

  import Picker from "./palette/Picker.svelte";
  import { settings, sources } from "../stores";
  import SourceSettingsModal from "./SourceSettingsModal";

  export let saveAllSourceSettings;
  export let writeSettingsToDisk;

  const flipDurationMs = 100;
  let dragDisabled = true;

  let activeItemId;
  let items = writable([]);
  let saveSettings = debounce(() => saveAllSourceSettings($items), 200, false);

  sources.subscribe((sourcesVal) => {
    items.set(
      sourcesVal.map(getSourceSettings).sort((a, b) => a.order - b.order)
    );
  });

  function getSourceSettings(source) {
    return {
      ...source,
      ...(source.defaultSettings || {}),
      ...settings.getSourceSettings(source.id),
    };
  }

  function handleConsider(event) {
    items.set(event.detail.items);

    if (event.detail.info.trigger === TRIGGERS.DRAG_STOPPED) {
      dragDisabled = true;
    }
  }

  function handleFinalize(event) {
    items.set(event.detail.items);
    dragDisabled = true;
    saveAllSourceSettings($items);
  }

  function startDrag(e) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }

  function handleKeyDown(e) {
    if ((e.key === "Enter" || e.key === " ") && dragDisabled)
      dragDisabled = false;
  }

  function handleTeardown() {
    activeItemId = null;
  }

  function setActiveItem(item) {
    activeItemId = item.id;
    const source = $sources.find((s) => s.id === item.id);
    const saveSource = (sourceSettings) =>
      writeSettingsToDisk((existingSettings) => {
        const newSettings = {
          ...existingSettings,
          sourceSettings: {
            ...existingSettings.sourceSettings,
            [item.id]: {
              ...existingSettings.sourceSettings[item.id],
              ...sourceSettings,
            },
          },
        };

        // mutate `item` so display refreshes
        item.display = sourceSettings.display;
        items.update((val) => val);
        settings.set(newSettings);
        return newSettings;
      });

    new SourceSettingsModal(
      window.app,
      source,
      saveSource,
      handleTeardown
    ).open();
  }
</script>

<div class="container">
  <div
    class="layout-grid"
    use:dndzone={{ items: $items, dragDisabled, flipDurationMs }}
    on:consider={handleConsider}
    on:finalize={handleFinalize}
  >
    {#each $items as item (item.id)}
      <div
        class="calendar-source"
        class:active={item.id === activeItemId}
        on:click|stopPropagation={() => setActiveItem(item)}
      >
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
        {item.name}
        <Picker
          highlighted={item.display === "calendar-and-menu"}
          bind:value={item.color}
          on:input={saveSettings}
        />
      </div>
    {/each}
  </div>
</div>

<style>
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
    background-color: var(--background-secondary);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    display: flex;
    font-size: 14px;
    margin: 4px 0;
    padding: 8px;
    width: 100%;
  }

  .calendar-source:hover {
    border: 1px solid var(--text-faint);
  }

  .calendar-source.active {
    border: 1px solid var(--text-accent-hover);
  }

  .calendar-source:nth-child(1),
  .calendar-source:nth-child(2) {
    width: calc(50% - 6px);
  }

  .handle {
    color: var(--background-modifier-border);
    height: 16px;
    margin-right: 8px;
    width: 16px;
  }

  .active .handle {
    color: var(--text-accent-hover);
  }

  .handle svg {
    width: 16px;
    height: 16px;
  }
</style>
