<script lang="ts">
  export let className: string = "";
  export let isFilled: boolean;
  export let isActive: boolean;
</script>

{#if isFilled}
  <svg
    class="{`dot filled ${className}`}"
    class:active="{isActive}"
    viewBox="0 0 6 6"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="3" r="2"></circle>
  </svg>
{:else}
  <svg
    class="{`hollow ${className}`}"
    class:active="{isActive}"
    viewBox="0 0 6 6"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="3" r="2"></circle>
  </svg>
{/if}

<style>
  .dot,
  .hollow {
    display: inline-block;
    height: 6px;
    width: 6px;
    margin: 0 1px;
  }

  .filled {
    fill: var(--color-dot);
  }

  .active.filled {
    fill: var(--text-on-accent);
  }

  .hollow {
    fill: none;
    stroke: var(--color-dot);
  }

  .active.hollow {
    fill: none;
    stroke: var(--text-on-accent);
  }
</style>
