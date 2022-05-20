<script lang="ts">
  import { fly } from "svelte/transition";

  import Arrow from "./Arrow.svelte";
  import { router } from "./router";
</script>

<div class="breadcrumbs">
  {#each $router.path as crumb, i}
    {@const crumbsSoFar = $router.path.slice(0, i + 1)}

    <div
      class="crumb"
      on:click={() => router.navigate(crumbsSoFar)}
      in:fly={{ x: -6, duration: 250 }}
      out:fly={{ x: -6, duration: 250 }}
    >
      {crumb}
    </div>
    {#if i < $router.path.length - 1}
      <Arrow isExpanded={false} />
    {/if}
  {/each}
</div>

<style lang="scss">
  .breadcrumbs {
    align-items: center;
    color: var(--text-muted);
    display: flex;
    margin-bottom: 24px;
  }

  .crumb {
    cursor: pointer;
    font-weight: 600;
    margin: 0 0.4em;

    &:first-of-type {
      margin-left: 0;
    }

    &:last-of-type {
      color: var(--text-normal);
    }

    &:hover {
      color: var(--text-accent);
    }
  }
</style>
