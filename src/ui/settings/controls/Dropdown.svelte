<script lang="ts">
  import { settings } from "src/ui/stores";

  interface IOption {
    label: string;
    value: string;
  }

  export let name: string;
  export let options: IOption[] = [];

  function onSelect(event: Event): void {
    const newValue = (event.target as HTMLSelectElement).value;
    $settings[name] = newValue;
  }
</script>

<!-- svelte-ignore a11y-no-onchange -->
<select class="dropdown" on:change={onSelect}>
  {#each options as { label, value }}
    <option {value}>{label}</option>
  {/each}
</select>
