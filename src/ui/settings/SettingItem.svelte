<script lang="ts">
  export let name: string;
  export let description: string;
  export let isHeading: boolean;
</script>

<div class="setting-item" class:setting-item-heading={isHeading}>
  <div class="setting-item-info">
    <div class="setting-item-name">
      <div>
        {name}
      </div>
    </div>
    {#if description}
      <div class="setting-item-description">
        {description}
      </div>
    {/if}
  </div>
  <div class="setting-item-control" />
  <slot name="control" />
</div>
