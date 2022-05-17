<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import type { Moment } from "moment";

  import { DISPLAYED_MONTH, TODAY } from "src/ui/context";
  import type { CalendarEventHandlers, ICalendarSource } from "src/ui/types";

  import Arrow from "./Arrow.svelte";
  import Dot from "./Dot.svelte";
  import Month from "./Month.svelte";
  import Year from "./Year.svelte";

  export let sources: ICalendarSource[];
  export let eventHandlers: CalendarEventHandlers;

  let today = getContext<Writable<Moment>>(TODAY);
  let displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);
  let showingCurrentMonth: boolean;

  function incrementDisplayedMonth() {
    displayedMonth.update((month) => month.clone().add(1, "month"));
  }

  function decrementDisplayedMonth() {
    displayedMonth.update((month) => month.clone().subtract(1, "month"));
  }

  function resetDisplayedMonth() {
    displayedMonth.set($today.clone());
  }

  $: showingCurrentMonth = $displayedMonth.isSame($today, "month");
</script>

<div class="nav">
  <span class="title">
    <Month {sources} {eventHandlers} on:hoverDay on:endHoverDay />
    <Year {sources} {eventHandlers} on:hoverDay on:endHoverDay />
  </span>
  <div class="right-nav">
    <Arrow
      direction="left"
      onClick={decrementDisplayedMonth}
      tooltip="Previous Month"
    />
    <div
      aria-label={!showingCurrentMonth ? "Reset to current month" : null}
      class="reset-button"
      class:active={!showingCurrentMonth}
      on:click={resetDisplayedMonth}
    >
      <Dot isFilled />
    </div>
    <Arrow
      direction="right"
      onClick={incrementDisplayedMonth}
      tooltip="Next Month"
    />
  </div>
</div>

<style lang="scss">
  .nav {
    align-items: baseline;
    display: flex;
    margin: 0.6em 0 1em;
    padding: 0 12px;
    width: 100%;
  }

  .title {
    color: var(--color-text-title);
    cursor: pointer;
    display: flex;
    font-size: 1.25em;
    gap: 0.3em;
    margin: 0;
    margin-bottom: 0.1em;
  }

  .right-nav {
    align-items: center;
    display: flex;
    justify-content: center;
    margin-left: auto;
  }

  .reset-button {
    align-items: center;
    color: var(--color-arrow);
    display: flex;
    opacity: 0.4;
    padding: 0.5em;

    &.active {
      cursor: pointer;
      opacity: 1;
    }
  }
</style>
