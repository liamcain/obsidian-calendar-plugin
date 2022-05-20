<script lang="ts">
  import type { App } from "obsidian";

  import type { ICalendarSource } from "src/types";

  import CalendarSetSwitcher from "./CalendarSetSwitcher.svelte";
  import SourcesToggler from "./SourcesToggler.svelte";

  export let app: App;
  export let sources: ICalendarSource[];
  export let selectedSourceIds: string[];
</script>

<div class="toolbar-container">
  <CalendarSetSwitcher {app} />
  <SourcesToggler on:changeSources {sources} {selectedSourceIds} />
</div>

<style lang="scss">
  .toolbar-container {
    align-items: center;
    border-bottom: 1px solid var(--background-modifier-border);
    display: flex;
    gap: 8px;
    margin-top: 0.2em;
    margin-right: -20px;
    padding: 0 0.5em 8px;
  }
</style>
