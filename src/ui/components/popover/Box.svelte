<script lang="ts">
  import type { IEvaluatedMetadata, SourceMetadata } from "src/ui/types";

  export let menuItems: SourceMetadata[];

  let showcaseItems: SourceMetadata[];
  let overflowItems: SourceMetadata[];

  $: {
    showcaseItems = (menuItems || []).slice(0, 2);
    overflowItems = (menuItems || []).slice(2);
  }
</script>

<div class="container">
  <div class="showcase">
    {#each showcaseItems as showcaseItem}
      <div class="showcase-item">
        <div class="item-value">
          {showcaseItem.value}
        </div>
        <div class="item-name">
          <svg
            class="showcase-dot"
            viewBox="0 0 6 6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle fill={showcaseItem.color} cx="3" cy="3" r="2" />
          </svg>
          {showcaseItem.name}
        </div>
      </div>
    {/each}
  </div>
  <div class="overflow-items">
    {#each overflowItems as overflowItem}
      <div class="overflow-item" class:empty={!overflowItem.value}>
        <div class="item-value">
          {overflowItem.value}
        </div>
        <svg class="dot" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
          <circle
            fill={overflowItem.value ? overflowItem.color : "currentColor"}
            cx="3"
            cy="3"
            r="2"
          />
        </svg>
        <div class="item-name">
          {overflowItem.name}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .container {
    background-color: var(--background-primary);
    border-radius: 4px;
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.25);
    color: white;
    display: flex;
    flex-direction: column;
    padding: 24px;
  }

  :global(.is-mobile) .container {
    box-shadow: unset;
    padding: 0;
  }

  .overflow-items {
    align-items: center;
    display: grid;
    grid-row-gap: 8px;
    grid-template-columns: auto auto minmax(160px, 2fr);
  }

  .showcase {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    margin-bottom: 12px;
  }

  .showcase-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    letter-spacing: 0.8px;
    text-align: right;
  }

  .showcase .item-value {
    font-size: 32px;
    margin-bottom: 4px;
    width: 100%;
  }

  .showcase .item-name {
    align-items: center;
    color: var(--text-muted);
    display: flex;
    font-size: 14px;
    font-weight: 700;
    justify-content: flex-end;
    text-transform: uppercase;
  }

  .item-value {
    font-size: 20px;
    font-weight: 500;
  }

  .item-name {
    color: var(--text-muted);
  }

  .overflow-item {
    display: contents;
    padding: 8px;
  }

  .overflow-item .item-value {
    margin-right: 8px;
  }

  .showcase-dot,
  .dot {
    flex-shrink: 0;
    margin-right: 6px;
    height: 8px;
    width: 8px;
  }

  .showcase-dot {
    height: 10px;
    width: 10px;
  }

  .empty .item-value,
  .empty .dot,
  .empty .item-name {
    color: var(--text-faint);
  }
</style>
