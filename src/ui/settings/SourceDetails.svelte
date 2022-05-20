<script lang="ts">
  import { onMount } from "svelte";
  import type { Writable } from "svelte/store";

  import CalendarPlugin from "src/main";
  import type { ISettings } from "src/settings";

  export let selectedSourceName: string;
  export let plugin: CalendarPlugin;

  let sourceSettingsEl: HTMLElement;
  let settings: Writable<ISettings> = plugin.settings;
  let source = plugin.registeredSources.find(
    (s) => s.name === selectedSourceName
  );

  onMount(() => {
    if (source) {
      source.registerSettings?.(
        sourceSettingsEl,
        $settings.sourceSettings[source.id],
        (newSettings) => {
          $settings.sourceSettings[source!.id] = {
            ...$settings.sourceSettings[source!.id],
            ...newSettings,
          };
        }
      );
    }
  });
</script>

{#if source}
  <div class="source-titlebar">
    <div class="source-title">{source.name}</div>
  </div>
  <div class="source-description">
    {source.description}
  </div>

  <div class="source-settings-container" bind:this={sourceSettingsEl} />
{/if}

<style lang="scss">
  .source-titlebar {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
  }

  .source-title {
    font-size: 1.6em;
    min-width: 100px;
  }

  .source-description {
    margin: 0.5em 0 1em;
  }

  .source-settings-container {
    border-top: 1px solid var(--background-modifier-border);
    padding-top: 0.8em;
  }
</style>
