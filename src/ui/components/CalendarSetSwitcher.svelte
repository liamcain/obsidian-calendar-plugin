<script lang="ts">
  import type { App, CalendarSet, EventRef } from "obsidian";
  import { setIcon } from "obsidian";
  import { onDestroy, onMount, tick } from "svelte";
  import { createPopperActions } from "svelte-popperjs";
  import { fly } from "svelte/transition";

  import Checkmark from "./Checkmark.svelte";
  import clickOutside from "../clickOutside";

  const [popperRef, popperContent] = createPopperActions({
    placement: "bottom",
    strategy: "absolute",
  });
  const extraOpts = {
    modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
  };

  export let app: App;

  let listEl: HTMLElement;
  let hoverItemIndex: number;
  let isShowingMenu = false;
  let arrowEl: HTMLElement;

  let activeCalendarSet = app.plugins
    .getPlugin("periodic-notes")
    .calendarSetManager.getActiveSet();
  let calendarSets = app.plugins
    .getPlugin("periodic-notes")
    .calendarSetManager.getCalendarSets();

  $: hoverItemIndex = calendarSets.indexOf(activeCalendarSet);

  function getCalendarSetConfiguration() {
    activeCalendarSet = app.plugins
      .getPlugin("periodic-notes")
      .calendarSetManager.getActiveSet();
    calendarSets = app.plugins
      .getPlugin("periodic-notes")
      .calendarSetManager.getCalendarSets();
  }

  let subscribeToSettings: EventRef;
  onMount(() => {
    subscribeToSettings = app.workspace.on(
      "periodic-notes:settings-updated",
      getCalendarSetConfiguration
    );
  });

  onDestroy(() => {
    app.workspace.offref(subscribeToSettings);
  });

  async function toggleMenu() {
    isShowingMenu = !isShowingMenu;

    if (isShowingMenu) {
      await tick();
      listEl.focus();
    }
  }

  function hideMenu() {
    isShowingMenu = false;
  }

  function switchCalendarSet(calendarSet: CalendarSet) {
    hideMenu();
    app.plugins
      .getPlugin("periodic-notes")
      .calendarSetManager.setActiveCalendarSet(calendarSet.id);
  }

  onMount(() => {
    setIcon(arrowEl, "down-chevron-glyph", 10);
  });

  function scrollToActiveItem() {
    let offsetBounding = 0;
    const focusedElemBounding = listEl.querySelector(".listItem.hover");
    if (focusedElemBounding) {
      offsetBounding =
        listEl.getBoundingClientRect().bottom -
        focusedElemBounding.getBoundingClientRect().bottom;
    }
    listEl.scrollTop -= offsetBounding;
  }

  async function updateHoverItem(increment: number) {
    if (increment > 0 && hoverItemIndex === calendarSets.length - 1) {
      hoverItemIndex = 0;
    } else if (increment < 0 && hoverItemIndex === 0) {
      hoverItemIndex = calendarSets.length - 1;
    } else {
      hoverItemIndex = hoverItemIndex + increment;
    }
    await tick();
    scrollToActiveItem();
  }

  function handleKeydown(e: KeyboardEvent) {
    e.preventDefault();
    switch (e.key) {
      case "Escape": {
        hideMenu();
        break;
      }
      case "ArrowDown": {
        updateHoverItem(1);
        break;
      }
      case "ArrowUp": {
        updateHoverItem(-1);
        break;
      }
      case "Enter": {
        switchCalendarSet(calendarSets[hoverItemIndex]);
        hideMenu();
        break;
      }
    }
  }
</script>

<div
  tabindex="0"
  class="switcher"
  class:open={isShowingMenu}
  on:click={toggleMenu}
  use:popperRef
>
  <span class="clipped">
    {activeCalendarSet.id}
  </span>
  <div class="triangle" bind:this={arrowEl} />
</div>
{#if isShowingMenu}
  <div class="popper" use:popperContent={extraOpts}>
    <div
      class="calendarset-menu"
      use:clickOutside
      bind:this={listEl}
      on:keydown={handleKeydown}
      tabindex="0"
      on:clickOutside={hideMenu}
      in:fly={{ y: -6, duration: 150 }}
      out:fly={{ y: -6, duration: 150 }}
    >
      {#each calendarSets as calendarSet, idx}
        <div
          class="menu-item"
          class:hover={hoverItemIndex === idx}
          class:active-set={calendarSet === activeCalendarSet}
          on:click={() => switchCalendarSet(calendarSet)}
        >
          {#if calendarSet === activeCalendarSet}
            <Checkmark />
          {/if}
          {calendarSet.id}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style lang="scss">
  .popper {
    z-index: var(--layer-popover);
  }

  .calendarset-menu {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    box-shadow: 0 4px 40px rgb(0 0 0 / 12%);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
  }

  .triangle {
    margin-left: 5px;
    position: relative;
    top: 2px;
    width: 11px;
  }

  .switcher {
    border-radius: 10px;
    border: 1px solid transparent;
    color: var(--text-muted);
    display: flex;
    line-height: 20px;
    cursor: pointer;
    font-size: 0.65em;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 0 8px 0 12px;
    text-align: center;
    transition: opacity 0.15s ease-in, border-color 0.15s ease-in;

    .clipped {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      color: var(--interactive-accent);
      border-color: var(--background-modifier-border);
    }

    &.open {
      color: var(--interactive-accent);
      border-color: var(--interactive-accent);

      .triangle {
        color: var(--interactive-accent);
      }
    }
  }

  .menu-item {
    align-items: center;
    border-radius: 4px;
    display: flex;
    padding: 4px 12px 4px 28px;
    position: relative;

    &.hover {
      background-color: var(--background-secondary);
    }

    &.active-set {
      font-weight: 600;
    }
  }
</style>
