<script lang="ts">
  export let sourceId: string;
  export let isFilled: boolean = false;
  export let isActive: boolean = false;
</script>

<svg
  class="dot"
  style="{`--color-dot: var(--calendar-source-${sourceId})`}"
  class:active="{isActive}"
  viewBox="0 0 6 6"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle
    stroke="{!isFilled ? 'currentColor' : 'none'}"
    fill="{isFilled ? 'currentColor' : 'none'}"
    cx="3"
    cy="3"
    r="2"></circle>
</svg>

<style lang="scss">
  .dot {
    color: var(--color-dot);
    display: inline-block;
    height: 6px;
    width: 6px;
    margin: 0 1px;

    &.active {
      color: var(--text-on-accent);
    }
  }
</style>
