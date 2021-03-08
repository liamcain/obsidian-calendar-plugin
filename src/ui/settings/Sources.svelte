<script>
  import { dndzone, SOURCES } from "svelte-dnd-action";
  import { flip } from "svelte/animate";

  import Toggle from "./controls/Toggle.svelte";
  import SettingItem from "./SettingItem.svelte";

  export let items = [];

  const flipDurationMs = 200;
  let dragDisabled = true;
  let activeItemId;

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
  }
</script>

<div class="container">
  <section
    class="layout-grid"
    use:dndzone={{ items, flipDurationMs, dragDisabled }}
    on:consider={handleConsider}
    on:finalize={handleFinalize}
  >
    {#each items as item (item.id)}
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
        <input class="color-picker" type="color" bind:value={item.color} />
      </div>
    {/each}
  </section>
  <section>
    <h4>Word Count</h4>
    <SettingItem name="Display">
      <Toggle slot="control" />
    </SettingItem>
  </section>
</div>

<style>
  .container {
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr 1fr;
  }

  .layout-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .calendar-source {
    cursor: pointer;
    align-items: center;
    background-color: var(--background-secondary);
    border-radius: 8px;
    border: 1px solid var(--background-modifier-border);
    display: flex;
    margin: 6px 0;
    padding: 12px;
    width: 100%;
  }

  .calendar-source:hover {
    border: 1px solid var(--dark2);
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
