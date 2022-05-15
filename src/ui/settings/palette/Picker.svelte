<script lang="ts">
  import { Platform } from "obsidian";
  import { createEventDispatcher } from "svelte";
  import { createPopperActions } from "svelte-popperjs";

  import clickOutside from "./clickOutside";
  import Palette from "./Palette.svelte";
  import MobileColorModal from "./MobileColorModal";

  export let disabled: boolean;
  export let highlighted: boolean;
  export let value: string;

  let isVisible: boolean = false;

  const dispatch = createEventDispatcher();
  const [popperRef, popperContent] = createPopperActions({
    placement: "bottom",
    strategy: "absolute",
  });
  const extraOpts = {
    modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
  };

  function setValue(newValue: string) {
    value = newValue;
    dispatch("input", value);
  }

  function close() {
    isVisible = false;
  }

  function toggleOpen(event: MouseEvent) {
    isVisible = !isVisible;
    event.stopPropagation();

    if (isVisible && Platform.isMobile) {
      new MobileColorModal(window.app, {
        close,
        setValue,
        value,
      }).open();
    }
  }
</script>

<div
  use:popperRef
  class="picker-btn"
  class:open={isVisible}
  class:highlighted
  class:disabled
  style="background-color:{value}"
  on:click={toggleOpen}
  {value}
/>
{#if isVisible && !Platform.isMobile}
  <div
    class="picker"
    on:click|stopPropagation
    use:clickOutside={close}
    use:popperContent={extraOpts}
    use:clickOutside
    on:clickOutside={toggleOpen}
  >
    <Palette on:input bind:value {close} />
  </div>
{/if}

<style lang="scss">
  .picker {
    background-color: var(--background-primary);
    border-radius: 8px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.25);
    max-width: 290px;
    padding: 12px;
    z-index: var(--layer-popover);
  }

  .picker-btn {
    border: 1px solid var(--background-modifier-border);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    margin-left: auto;
    height: 24px;
    width: 24px;

    &.open {
      border: 2px solid var(--text-normal);
    }

    &.highlighted {
      box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.15);
    }

    &.disabled {
      background-color: transparent !important;
    }

    &:hover {
      border: 1px solid var(--text-muted);
    }

    :global(.is-mobile) & {
      height: 32px;
      width: 32px;
    }
  }
</style>
