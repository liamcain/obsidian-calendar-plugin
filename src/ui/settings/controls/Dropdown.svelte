<script lang="ts">
  interface IOption {
    label: string;
    value: string;
  }

  export let onChange: (e: Event) => void;
  export let options: IOption[] = [];
  export let value: string;
</script>

<!-- svelte-ignore a11y-no-onchange -->
<select class="dropdown" on:change={onChange} {value}>
  {#each options as { label, value }}
    <option {value}>{label}</option>
  {/each}
</select>
