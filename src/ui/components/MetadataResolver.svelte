<svelte:options immutable />

<script lang="ts">
  import type { SourceMetadata } from "../types";

  export let metadata: Promise<SourceMetadata[]>;
  let previouslyResolvedMeta: SourceMetadata[] = [];

  $: metadata.then((resolved) => {
    previouslyResolvedMeta = resolved;
  });
</script>

{#if metadata}
  {#await metadata}
    <slot metadata="{previouslyResolvedMeta}" />
  {:then resolvedMeta}
    <slot metadata="{resolvedMeta}" />
  {/await}
{:else}
  <slot metadata="{previouslyResolvedMeta}" />
{/if}
