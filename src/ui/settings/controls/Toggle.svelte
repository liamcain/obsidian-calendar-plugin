<script lang="ts">
  import { settings } from "src/ui/stores";

  export let name: string;

  function toggleEnabled() {
    $settings[name] = !$settings[name];
  }
</script>

<div
  class="checkbox-container"
  class:is-enabled={$settings[name]}
  on:click={toggleEnabled}
/>
