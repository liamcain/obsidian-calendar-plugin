<script lang="ts">
  interface IOption {
    label: string;
    value: string;
  }
  export let options: IOption[] = [];
</script>

<select class="dropdown">
  {#each options as { label, value }}
    <option {value}>{label}</option>
  {/each}
</select>
