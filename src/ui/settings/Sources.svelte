<script>
  import { dndzone, SOURCES } from "svelte-dnd-action";
  import { flip } from "svelte/animate";

  import { settings, sources } from "../stores";

  export let saveAllSourceSettings;
  export let writeOptions;

  const flipDurationMs = 200;
  let dragDisabled = true;
  let activeItemId;
  let sourceSettingsEl;
  let items;

  // let allSettings = {
  //   settings: {
  //     wordCount: {
  //       color: "#7FA1C0",
  //       display: "menu-and-calendar",
  //       order: 0,
  //       wordsPerDot: 250,
  //     },
  //     tasks: {
  //       color: "#BF616A",
  //       display: "menu-and-calendar",
  //       order: 1,
  //       showAllTaskDots: false,
  //     },
  //     zettels: {
  //       color: "#ebcb8b",
  //       display: "menu",
  //       order: 2,
  //     },
  //     links: {
  //       color: "#b48ead",
  //       display: "none",
  //       order: 4,
  //     },
  //     backlinks: {
  //       color: "#5e81ac",
  //       display: "menu",
  //       order: 3,
  //     },
  //   },
  // };

  $: items = $sources
    .map((source) => ({
      ...source,
      ...($settings.sourceSettings[source.id] || {}),
    }))
    .sort((a, b) => a.order - b.order);

  function handleConsider(event) {
    const {
      items: newItems,
      info: { source, trigger },
    } = event.detail;

    items = newItems;
    // Ensure dragging is stopped on drag finish via keyboard
    if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
      dragDisabled = true;
    }
  }

  function handleFinalize(event) {
    const {
      items: newItems,
      info: { source },
    } = event.detail;

    items = newItems;
    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      dragDisabled = true;
    }

    saveAllSourceSettings(items);
  }

  function startDrag(e) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }

  function stopDrag(e) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = true;
  }

  function setActiveItem(item) {
    activeItemId = item.id;
    sourceSettingsEl.empty();
    sourceSettingsEl.createEl("h4", {
      text: item.name,
    });

    const source = $sources.find((s) => s.id === item.id);
    const saveSource = (sourceSettings) =>
      writeOptions((existingSettings) => {
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
        settings.set(newSettings);
        return newSettings;
      });

    source.registerSettings?.(sourceSettingsEl, item, saveSource);
  }
</script>

<div class="container">
  <section
    class="layout-grid"
    use:dndzone={{ items, flipDurationMs, dragDisabled }}
    on:consider={handleConsider}
    on:finalize={handleFinalize}
  >
    {#each items as item (item)}
      <div
        animate:flip={{ duration: flipDurationMs }}
        class="calendar-source"
        class:active={item.id === activeItemId}
        on:click={() => setActiveItem(item)}
      >
        <div
          aria-label="drag-handle"
          class="handle"
          style={dragDisabled ? "cursor: grab" : "cursor: grabbing"}
          tabindex={dragDisabled ? 0 : -1}
          on:mousedown={startDrag}
          on:mouseup={stopDrag}
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
        <input
          class="color-picker"
          type="color"
          bind:value={item.color}
          on:input={() => saveAllSourceSettings(items)}
        />
      </div>
    {/each}
  </section>
  <section bind:this={sourceSettingsEl}>
    <div class="calendar-source-empty-state" />
  </section>
</div>

<style>
  .container {
    border-top: 1px solid var(--background-modifier-border);
    display: grid;
    gap: 32px;
    grid-template-columns: 1fr 1fr;
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
    cursor: pointer;
    align-items: center;
    background-color: var(--background-secondary);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    display: flex;
    font-size: 14px;
    margin: 6px 0;
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

  .color-picker {
    margin-left: auto;
  }
</style>
