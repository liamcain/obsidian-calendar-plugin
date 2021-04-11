<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import clickOutside from "./clickOutside";
  import Palette from "./Palette.svelte";
  import Popper from "./Popper.svelte";
  import MobileColorModal from "./MobileColorModal";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMobile = (window.app as any).isMobile;

  export let highlighted: boolean;
  export let value: string;

  let referenceElement: HTMLElement;
  let isVisible: boolean = false;

  const dispatch = createEventDispatcher();

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

    if (isVisible && isMobile) {
      new MobileColorModal(window.app, {
        close,
        setValue,
        value,
      }).open();
    }
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
{#if isVisible && !isMobile}
  <Popper {referenceElement} {isVisible} placement="bottom">
    <div class="picker" on:click|stopPropagation use:clickOutside={close}>
      <Palette on:input bind:value {close} />
    </div>
  </Popper>
{/if}

<style>
  .picker {
    background-color: var(--background-primary);
    border-radius: 8px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.25);
    max-width: 290px;
    padding: 12px;
    z-index: var(--layer-popover);
  }

  .picker-btn {
    margin-left: auto;
  }

  .picker-btn {
    border: 1px solid var(--background-modifier-border);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    height: 24px;
    width: 24px;
  }

  :global(.is-mobile) .picker-btn {
    height: 32px;
    width: 32px;
  }

  .picker-btn:hover {
    border: 1px solid var(--text-muted);
  }

  .picker-btn.open {
    border: 2px solid var(--text-normal);
  }

  .picker-btn.highlighted {
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.15);
  }
</style>
