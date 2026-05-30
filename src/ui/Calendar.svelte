<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import {
    Calendar as CalendarBase,
    ICalendarSource,
    configureGlobalMomentLocale,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";

  import type { ISettings } from "src/settings";
  import { getDailyNotesForDate } from "src/io/dailyNoteIndex";
  import {
    activeFile,
    dailyNotes,
    dailyNotesByDate,
    settings,
    weeklyNotes,
  } from "./stores";

  let today: Moment;
  let selectedDate: Moment = null;
  let selectedNotes: TFile[] = [];
  let isScanFoldersOpen = false;
  let scanFoldersValue = "";
  let scanFoldersSummary = "";
  let isSavingScanFolders = false;

  $: today = getToday($settings);
  $: if (!selectedDate && today) {
    selectedDate = today;
  }
  $: selectedNotes = selectedDate
    ? getDailyNotesForDate(selectedDate, $dailyNotesByDate, $dailyNotes)
    : [];
  $: if (
    !isScanFoldersOpen &&
    scanFoldersValue !== $settings.dailyNoteIncludedFolders
  ) {
    scanFoldersValue = $settings.dailyNoteIncludedFolders;
  }
  $: scanFoldersSummary = getScanFoldersSummary(
    $settings.dailyNoteIncludedFolders
  );

  export let displayedMonth: Moment = today;
  export let sources: ICalendarSource[];
  export let onHoverDay: (date: Moment, targetEl: EventTarget) => boolean;
  export let onHoverWeek: (date: Moment, targetEl: EventTarget) => boolean;
  export let onClickDay: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickWeek: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onContextMenuDay: (date: Moment, event: MouseEvent) => boolean;
  export let onContextMenuWeek: (date: Moment, event: MouseEvent) => boolean;
  export let onOpenDayNote: (
    file: TFile,
    inNewSplit: boolean
  ) => Promise<void>;
  export let onUpdateSettings: (
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ) => Promise<void>;

  export function tick() {
    today = window.moment();
  }

  function getToday(settings: ISettings) {
    configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
    dailyNotes.reindex();
    weeklyNotes.reindex();
    return window.moment();
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    tick();

    const isViewingCurrentMonth = displayedMonth.isSame(today, "day");
    if (isViewingCurrentMonth) {
      // if it's midnight on the last day of the month, this will
      // update the display to show the new month.
      displayedMonth = today;
    }
  }, 1000 * 60);

  onDestroy(() => {
    clearInterval(heartbeat);
  });

  function handleClickDay(date: Moment, isMetaPressed: boolean): boolean {
    selectedDate = date.clone();
    return onClickDay(date, isMetaPressed);
  }

  function handleOpenDayNote(event: MouseEvent, file: TFile): void {
    event.preventDefault();
    onOpenDayNote(file, event.metaKey || event.ctrlKey);
  }

  function handleToggleScanFolders(): void {
    isScanFoldersOpen = !isScanFoldersOpen;
    if (isScanFoldersOpen) {
      scanFoldersValue = $settings.dailyNoteIncludedFolders;
    }
  }

  async function handleSaveScanFolders(): Promise<void> {
    isSavingScanFolders = true;
    try {
      await onUpdateSettings(() => ({
        dailyNoteIncludedFolders: scanFoldersValue,
      }));
    } finally {
      isSavingScanFolders = false;
    }
  }

  async function handleClearScanFolders(): Promise<void> {
    scanFoldersValue = "";
    await handleSaveScanFolders();
  }

  function handleScanFoldersKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSaveScanFolders();
    }
  }

  function getScanFoldersSummary(value: string): string {
    const folders = getListValues(value);
    if (!folders.length) {
      return "All vault";
    }
    return `${folders.length} folder${folders.length === 1 ? "" : "s"}`;
  }

  function formatNoteCount(count: number): string {
    return `${count} note${count === 1 ? "" : "s"}`;
  }

  function getListValues(value: string): string[] {
    return value
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
</script>

<CalendarBase
  {sources}
  {today}
  {onHoverDay}
  {onHoverWeek}
  {onContextMenuDay}
  {onContextMenuWeek}
  onClickDay={handleClickDay}
  {onClickWeek}
  bind:displayedMonth
  localeData={today.localeData()}
  selectedId={$activeFile}
  showWeekNums={$settings.showWeeklyNote}
/>

{#if selectedDate}
  <section class="calendar-note-panel">
    <div class="calendar-note-panel-header">
      <span>{selectedDate.format("LL")}</span>
      <span class="calendar-note-count">
        {formatNoteCount(selectedNotes.length)}
      </span>
    </div>

    {#if selectedNotes.length}
      <ul class="calendar-note-list">
        {#each selectedNotes as note (note.path)}
          <li>
            <button
              class="calendar-note-list-item"
              type="button"
              title={note.path}
              on:click={(event) => handleOpenDayNote(event, note)}
            >
              <span class="calendar-note-title">{note.basename}</span>
              <span class="calendar-note-path">{note.path}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="calendar-note-empty">No notes</div>
    {/if}
  </section>
{/if}

<section class="calendar-filter-panel">
  <button
    class="calendar-filter-toggle"
    type="button"
    aria-expanded={isScanFoldersOpen}
    on:click={handleToggleScanFolders}
  >
    <span>Scan folders</span>
    <span class="calendar-filter-summary">{scanFoldersSummary}</span>
  </button>

  {#if isScanFoldersOpen}
    <div class="calendar-filter-body">
      <textarea
        class="calendar-filter-textarea"
        rows="3"
        bind:value={scanFoldersValue}
        on:keydown={handleScanFoldersKeydown}
        placeholder="Journal, Work/Daily, Projects/Research"
      />
      <div class="calendar-filter-actions">
        <button
          class="calendar-filter-action"
          type="button"
          disabled={isSavingScanFolders ||
            scanFoldersValue === $settings.dailyNoteIncludedFolders}
          on:click={handleSaveScanFolders}
        >
          Apply
        </button>
        <button
          class="calendar-filter-action"
          type="button"
          disabled={isSavingScanFolders ||
            !$settings.dailyNoteIncludedFolders}
          on:click={handleClearScanFolders}
        >
          All vault
        </button>
      </div>
    </div>
  {/if}
</section>
