<script lang="ts">
  import type { Moment } from "moment";
  import { createEventDispatcher, getContext } from "svelte";
  import type { Writable } from "svelte/store";

  import { evaluateMetadataFromSources, getAttributes } from "src/ui/utils";

  import { DISPLAYED_MONTH } from "../context";
  import Dots from "./Dots.svelte";
  import MetadataResolver from "./MetadataResolver.svelte";
  import type {
    CalendarEventHandlers,
    ICalendarSource,
    SourceMetadata,
  } from "../types";

  export let eventHandlers: CalendarEventHandlers;
  export let sources: ICalendarSource[];
  let metadata: Promise<SourceMetadata[]>;

  let displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);
  const dispatch = createEventDispatcher();

  $: metadata = evaluateMetadataFromSources(sources, "month", $displayedMonth);

  function handleHover(event: PointerEvent, meta: SourceMetadata[]) {
    const date = $displayedMonth;
    eventHandlers.onHover?.("month", date, event);
    dispatch("hoverDay", {
      date,
      metadata: meta,
      target: event.target,
    });
  }

  function endHover(event: PointerEvent) {
    dispatch("endHoverDay", {
      target: event.target,
    });
  }
</script>

<MetadataResolver {metadata} let:metadata>
  <div
    draggable={true}
    on:click={(e) => eventHandlers.onClick?.("month", $displayedMonth, e)}
    on:contextmenu={metadata &&
      ((e) => eventHandlers.onContextMenu?.("month", $displayedMonth, e))}
    on:pointerenter={(event) => handleHover(event, metadata)}
    on:pointerleave={endHover}
    {...getAttributes(metadata)}
  >
    <!-- on:dragstart={(event) => fileCache.onDragStart(event, file)} -->
    <span class="month">
      {$displayedMonth.format("MMMM")}
    </span>
    {#if metadata}
      <Dots {metadata} centered={false} />
    {/if}
  </div>
</MetadataResolver>

<style>
  .month {
    font-weight: 500;
    font-size: 1.25em !important;
  }
</style>
