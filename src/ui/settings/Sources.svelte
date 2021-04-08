<script>
  import { debounce, Setting } from "obsidian";

  import { writable } from "svelte/store";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";

  import Picker from "./palette/Picker.svelte";
  import { settings, sources } from "../stores";

  export let saveAllSourceSettings;
  export let writeSettingsToDisk;

  const flipDurationMs = 100;

  let activeItemId;
  let sourceSettingsEl;
  let items = writable([]);
  let saveSettings = debounce(() => saveAllSourceSettings($items), 200, false);

  $: {
    items.set(
      $sources.map(getSourceSettings).sort((a, b) => a.order - b.order)
    );
  }

  function getSourceSettings(source) {
    return {
      ...source,
      ...(source.defaultSettings || {}),
      ...settings.getSourceSettings(source.id),
    };
  }

  function handleConsider(event) {
    items.set(event.detail.items);
  }

  function handleFinalize(event) {
    items.set(event.detail.items);
    saveAllSourceSettings($items);
  }

  function setActiveItem(item) {
    activeItemId = item.id;
    sourceSettingsEl.empty();
    sourceSettingsEl.createEl("h4", {
      text: item.name,
    });

    if (item.description) {
      sourceSettingsEl.createEl("div", {
        cls: "setting-item-description",
        text: item.description,
      });
    }

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

    const displayValue = settings.getSourceSettings(activeItemId)?.display;
    new Setting(sourceSettingsEl).setName("Display").addDropdown((dropdown) => {
      dropdown
        .addOption("calendar-and-menu", "On Calendar")
        .addOption("menu", "In Menu")
        .addOption("none", "Hidden")
        .onChange((display) => {
          saveSource({ display });
        })
        .setValue(displayValue);
    });

    source.registerSettings?.(sourceSettingsEl, item, saveSource);
  }
</script>

<div class="container">
  <section>
    <div
      class="layout-grid"
      use:dndzone={{ items: $items, flipDurationMs }}
      on:consider={handleConsider}
      on:finalize={handleFinalize}
    >
      {#each $items as item (item.id)}
        <div
          animate:flip={{ duration: flipDurationMs }}
          class="calendar-source"
          class:active={item.id === activeItemId}
          on:click|stopPropagation={() => setActiveItem(item)}
        >
          <div aria-label="Drag to rearrange" class="handle">
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
  </section>
  <section bind:this={sourceSettingsEl}>
    <div class="calendar-source-empty-state" />
  </section>
</div>

<style>
  .container {
    border-top: 1px solid var(--background-modifier-border);
    display: flex;
    display: grid;
    gap: 32px;
    margin-top: 8px;
    padding-top: 8px;
  }

  .layout-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .calendar-source {
    transition: border-color 0.1s ease-in-out;
    align-items: center;
    background-color: var(--background-secondary);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    display: flex;
    font-size: 14px;
    margin: 6px 0;
    min-width: 160px;
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
