<script lang="ts">
  import type { SourceMetadata } from "src/types";

  import Dot from "./Dot.svelte";

  export let centered: boolean = true;
  export let metadata: SourceMetadata[];

  const MAX_DOTS_PER_SOURCE = 5;
</script>

<div class="dot-container" class:centered>
  {#each metadata as sourceMeta}
    {#each sourceMeta.dots.slice(0, MAX_DOTS_PER_SOURCE) as dot}
      <Dot {...dot} sourceId="{sourceMeta.sourceId}" />
    {/each}
  {/each}
</div>

<style>
  .dot-container {
    pointer-events: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, 6px);
    column-gap: 1px;
    min-height: 6px;
    row-gap: 1px;
  }

  .centered {
    justify-content: center;
  }
</style>
