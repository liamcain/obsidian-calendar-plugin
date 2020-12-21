<script lang="ts">
  import type { Moment } from "moment";

  import Dot from "./Dot.svelte";
  import type { IDayMetadata } from "./sources/CalendarSource";
  import { displayedMonth } from "./stores";
  import { isMetaPressed } from "./utils";

  export let date: Moment;
  export let onHover: (date: Moment, targetEl: EventTarget) => void;
  export let onClick: (date: Moment, isMetaPressed: boolean) => void;
  export let today: Moment;
  export let metadata: IDayMetadata;
</script>

<style>
  .day {
    background-color: var(--color-background-day);
    border-radius: 4px;
    color: var(--color-text-day);
    cursor: pointer;
    font-size: 0.8em;
    height: 100%;
    padding: 4px;
    position: relative;
    text-align: center;
    transition: background-color 0.1s ease-in, color 0.1s ease-in;
    vertical-align: baseline;
  }
  .day:hover {
    background-color: var(--interactive-hover);
  }

  .day.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  .adjacent-month {
    opacity: 0.25;
  }

  .today {
    color: var(--color-text-today);
  }

  .active,
  .active.today {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
  }

  .dot-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    line-height: 6px;
    min-height: 6px;
  }
</style>

<svelte:options immutable />
<td>
  <div
    class={`day ${metadata.classes.join(' ')}`}
    class:adjacent-month={!date.isSame($displayedMonth, 'month')}
    class:today={date.isSame(today, 'day')}
    on:click={(e) => {
      onClick(date, isMetaPressed(e));
    }}
    on:pointerover={(e) => {
      if (isMetaPressed(e)) {
        onHover(date, e.target);
      }
    }}>
    {date.format('D')}

    <div class="dot-container">
      {#await metadata.dots then dots}
        {#each dots as dot}
          <Dot {...dot} />
        {/each}
      {/await}
    </div>
  </div>
</td>
