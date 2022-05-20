<script lang="ts">
  import { setIcon } from "obsidian";
  import { onMount } from "svelte";

  export let iconType: string;
  export let size: number;
  export let onClick: () => void;

  let iconEl: HTMLElement;

  onMount(() => {
    setIcon(iconEl, iconType, size);
  });
</script>

<div
  class="setting-editor-extra-setting-button clickable-icon"
  bind:this={iconEl}
  on:click={onClick}
/>
