<script lang="ts">
  import { getContext } from "svelte";
  import { createPopperActions } from "svelte-popperjs";

  import Box from "./Box.svelte";
  import { IS_MOBILE } from "../../context";

  type IDayMetadata = any;

  const [popperRef, popperContent] = createPopperActions({
    placement: "bottom",
    strategy: "absolute",
  });
  export let referenceElement: HTMLElement | null;
  export let metadata: IDayMetadata[];

  export let isVisible: boolean;
  const isMobile = getContext(IS_MOBILE);
  const extraOpts = {
    modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
  };

  let menuItems: IDayMetadata[];
  $: menuItems = (metadata || [])
    .filter((meta) => ["menu", "calendar-and-menu"].includes(meta.display))
    .filter((meta) => meta.value !== undefined)
    .sort((a, b) => a.order - b.order);

  $: {
    if (referenceElement) {
      popperRef(referenceElement);
    }
  }
</script>

{#if isVisible}
  {#if isMobile}
    <Box {menuItems} />
  {:else}
    <div use:popperContent={extraOpts} class="popover-menu">
      <Box {menuItems} />
    </div>
  {/if}
{/if}
