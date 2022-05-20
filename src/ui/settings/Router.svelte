<script lang="ts">
  import type { App } from "obsidian";
  import { onDestroy } from "svelte";

  import Breadcrumbs from "./Breadcrumbs.svelte";
  import CalendarPlugin from "src/main";

  import Dashboard from "./Dashboard.svelte";
  import { router } from "./router";
  import Details from "./SourceDetails.svelte";

  export let app: App;
  export let plugin: CalendarPlugin;

  onDestroy(() => {
    router.reset();
  });
</script>

<Breadcrumbs />

{#if $router.path.length > 1}
  {#key $router.path[1]}
    <Details {plugin} selectedSourceName={$router.path[1]} />
  {/key}
{:else}
  <Dashboard {app} {plugin} />
{/if}
