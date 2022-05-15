<script lang="ts">
  export let isEnabled: boolean;
  export let onChange: (value: boolean) => void;
</script>

<div
  class="checkbox-container"
  class:is-enabled={isEnabled}
  on:click={() => onChange(!isEnabled)}
/>
