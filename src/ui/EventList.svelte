<svelte:options immutable={false} />

<script lang="ts">
  import { eventsStore } from "src/events/store";
  import type { CalendarEvent, SortBy } from "src/events/types";
  import { sortEvents, getTimeUntil, formatTimeUntil } from "src/events/utils";
  import { openEventModal } from "./eventModal";
  import { selectedDate } from "./stores";
  import { downloadICS, syncEventToGoogle } from "src/integrations/google";
  import { settings } from "./stores";
  import { get } from "svelte/store";
  import { snoozed } from "src/events/snooze";

  export let dateStr: string; // YYYY-MM-DD

  let sortBy: SortBy = "timeUntil";
  let now = new Date();

  // atualiza "tempo até" a cada minuto
  let interval: number;
  import { onMount, onDestroy } from "svelte";
  onMount(() => {
    interval = window.setInterval(() => (now = new Date()), 60000);
  });
  onDestroy(() => clearInterval(interval));

  $: allForDate = $eventsStore[dateStr] ? [...$eventsStore[dateStr]] : [];
  $: sorted = sortEvents(allForDate, sortBy, now);

  function isSnoozed(id: string): boolean {
    const until = $snoozed[id];
    return !!until && until > now.getTime();
  }
  function isPast(ev: CalendarEvent): boolean {
    if (isSnoozed(ev.id)) return false;
    return getTimeUntil(ev, now) < 0;
  }
  function snoozedLabel(id: string): string {
    const until = $snoozed[id];
    if (!until) return "";
    const ms = until - now.getTime();
    if (ms <= 0) return "";
    const mins = Math.ceil(ms / 60000);
    return `adiado ${mins}min`;
  }

  function handleAdd() {
    openEventModal(window.app, dateStr);
  }

  function handleEdit(ev: CalendarEvent) {
    openEventModal(window.app, ev.date, ev);
  }

  function handleDelete(ev: CalendarEvent) {
    if (confirm(`Remover "${ev.title}"?`)) {
      eventsStore.deleteEvent(ev.id, ev.date);
    }
  }

  function handleExport(ev: CalendarEvent) {
    downloadICS(ev);
  }

  function handleExportAll() {
    for (const ev of sorted) downloadICS(ev);
  }

  async function handleSyncGoogle(ev: CalendarEvent) {
    const $settings = get(settings);
    if (!$settings.googleSyncEnabled || !$settings.googleAccessToken) {
      // @ts-ignore
      new (window as unknown as { Notice: new (msg:string)=>unknown }).Notice("Configure Google Sync nas Settings");
      return;
    }
    // @ts-ignore
    const NoticeClass = (window as unknown as { Notice: new (msg:string)=>unknown }).Notice;
    new NoticeClass(`Sincronizando "${ev.title}"...`);
    const res = await syncEventToGoogle(ev, $settings.googleAccessToken, $settings.googleCalendarId);
    if (res.ok) {
      if (res.googleEventId && res.googleEventId !== ev.googleEventId) {
        eventsStore.updateEvent({ ...ev, googleEventId: res.googleEventId });
      }
      new NoticeClass(`✓ Sincronizado com Google: ${ev.title}`);
    } else {
      new NoticeClass(`Falha Google: ${res.error}`);
    }
  }

  async function handleSyncAllGoogle() {
    for (const ev of sorted) await handleSyncGoogle(ev);
  }

  function selectDateRelative(offset: number) {
    const d = window.moment(dateStr, "YYYY-MM-DD").add(offset, "days");
    selectedDate.set(d.format("YYYY-MM-DD"));
  }

  function handleDragStart(e: DragEvent, ev: CalendarEvent) {
    const payload = JSON.stringify({ id: ev.id, fromDate: ev.date });
    e.dataTransfer?.setData("text/plain", payload);
    e.dataTransfer?.setData("text/calendar-event", payload);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    // highlight dragging
    const target = e.currentTarget as HTMLElement;
    target?.classList.add("is-dragging");
  }
  function handleDragEnd(e: DragEvent) {
    (e.currentTarget as HTMLElement)?.classList.remove("is-dragging");
  }
</script>

<div class="calendar-event-list">
  <div class="calendar-event-header">
    <div class="calendar-event-title">
      <button class="clickable-icon" on:click={() => selectDateRelative(-1)} aria-label="Dia anterior">‹</button>
      <span class="calendar-event-date">{window.moment(dateStr, "YYYY-MM-DD").format("DD MMM YYYY")}</span>
      <button class="clickable-icon" on:click={() => selectDateRelative(1)} aria-label="Próximo dia">›</button>
      <span class="calendar-event-count">{allForDate.length} {allForDate.length === 1 ? "evento" : "eventos"}</span>
    </div>
    <div class="calendar-event-actions">
      <select bind:value={sortBy} class="dropdown">
        <option value="timeUntil">Tempo até</option>
        <option value="name">Nome A-Z</option>
      </select>
      {#if sorted.length}
        <button title="Exportar dia em .ics" on:click={handleExportAll}>⤓ ICS</button>
        {#if $settings.googleSyncEnabled}
          <button title="Sincronizar dia com Google" on:click={handleSyncAllGoogle}>↗ Google</button>
        {/if}
      {/if}
      <button class="mod-cta" on:click={handleAdd}>+ Novo</button>
    </div>
  </div>

  {#if sorted.length === 0}
    <div class="calendar-empty">
      <p>Nenhum evento neste dia.</p>
      <button on:click={handleAdd}>Adicionar evento</button>
    </div>
  {:else}
    <div class="calendar-events">
      {#each sorted as ev (ev.id)}
        <div class="calendar-event-item" class:is-past={isPast(ev)} class:is-snoozed={isSnoozed(ev.id)} class:is-google={!!ev.googleEventId} style="border-left-color: {ev.googleEventId ? 'transparent' : ev.color}" draggable="true" on:dragstart={(e) => handleDragStart(e, ev)} on:dragend={handleDragEnd}>
          <div class="event-dot" style="background: {ev.googleEventId ? 'linear-gradient(135deg, #4285F4 0%, #DB4437 33%, #F4B400 66%, #0F9D58 100%)' : ev.color}"></div>
          <div class="event-main">
            <div class="event-title-row">
              <span class="event-title">{ev.title} {#if ev.googleEventId}<span class="google-badge" title="Sincronizado com Google Agenda">G</span>{/if}</span>
              <span class="event-time">{ev.time} <span class="event-tz">({ev.timezone})</span></span>
            </div>
            {#if ev.description}
              <div class="event-desc">{ev.description}</div>
            {/if}
            <div class="event-meta">
              <span class="event-until" class:past={isPast(ev)}>{isSnoozed(ev.id) ? snoozedLabel(ev.id) : formatTimeUntil(getTimeUntil(ev, now))}</span>
              {#if ev.location}
                <span class="event-location">📍 {ev.location}</span>
              {/if}
              {#if ev.attendees && ev.attendees.length}
                <span class="event-attendees">👥 {ev.attendees.join(", ")}</span>
              {/if}
              {#if ev.repeat !== "none"}
                <span class="event-repeat">🔁 {ev.repeat}</span>
              {/if}
            </div>
          </div>
          <div class="event-actions">
            {#if $settings.googleSyncEnabled}
              <button class="clickable-icon" title="Sincronizar com Google" on:click={() => handleSyncGoogle(ev)}>↗</button>
            {/if}
            <button class="clickable-icon" title="Exportar .ics" on:click={() => handleExport(ev)}>⤓</button>
            <button class="clickable-icon" title="Editar" on:click={() => handleEdit(ev)}>✎</button>
            <button class="clickable-icon" title="Remover" on:click={() => handleDelete(ev)}>🗑</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .calendar-event-list {
    margin-top: 1em;
    padding-top: 0.8em;
    border-top: 1px solid var(--background-modifier-border);
  }
  .calendar-event-header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    flex-wrap:wrap;
    gap:0.6em;
    margin-bottom:0.8em;
  }
  .calendar-event-title { display:flex; align-items:center; gap:0.4em; color: var(--text-normal); }
  .calendar-event-date { font-weight:600; }
  .calendar-event-count { font-size:0.8em; color: var(--text-muted); margin-left:0.3em; }
  .calendar-event-actions { display:flex; gap:0.5em; align-items:center; }
  .calendar-event-actions select { background: var(--background-primary); color: var(--text-normal); border:1px solid var(--background-modifier-border); border-radius:4px; padding:4px 6px; }
  .calendar-empty { text-align:center; padding:1em; color: var(--text-muted); background: var(--background-secondary); border-radius:6px; }
  .calendar-events { display:flex; flex-direction:column; gap:0.6em; }
  .calendar-event-item {
    display:flex; gap:0.7em; align-items:flex-start;
    background: var(--background-primary);
    border:1px solid var(--background-modifier-border);
    border-left:4px solid var(--interactive-accent);
    border-radius:6px;
    padding:0.6em 0.7em;
  }
  .calendar-event-item.is-past { opacity:0.65; }
  .calendar-event-item.is-snoozed { opacity:1 !important; border-color: var(--interactive-accent); box-shadow: 0 0 0 1px var(--interactive-accent); }
  .calendar-event-item.is-google { border-left-color: transparent !important; border-image: linear-gradient(to bottom, #4285F4 0%, #DB4437 25%, #F4B400 50%, #0F9D58 75%, #4285F4 100%) 1; border-left-width:4px; border-left-style:solid; }
  .calendar-event-item.is-google.is-past { opacity:0.8; }
  .google-badge { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:50%; background: linear-gradient(135deg, #4285F4, #DB4437, #F4B400, #0F9D58); color:white; font-size:0.7em; font-weight:700; margin-left:4px; }
  .calendar-event-item[draggable="true"] { cursor: grab; }
  .calendar-event-item.is-dragging { opacity:0.5; }
  .calendar-event-item:active[draggable="true"] { cursor: grabbing; }
  .event-dot { width:10px; height:10px; border-radius:50%; margin-top:0.5em; flex-shrink:0; }
  .event-main { flex:1; min-width:0; }
  .event-title-row { display:flex; justify-content:space-between; gap:0.5em; }
  .event-title { font-weight:600; color: var(--text-normal); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .event-time { font-size:0.85em; color: var(--text-muted); white-space:nowrap; }
  .event-tz { font-size:0.8em; opacity:0.8; }
  .event-desc { font-size:0.85em; color: var(--text-muted); margin:0.2em 0; white-space:pre-wrap; }
  .event-meta { display:flex; gap:0.6em; flex-wrap:wrap; font-size:0.78em; color: var(--text-muted); }
  .event-until { font-weight:600; color: var(--interactive-accent); }
  .event-until.past { color: var(--text-muted); }
  .event-actions { display:flex; gap:0.2em; }
  .event-actions button { font-size:1em; padding:2px 6px; }
</style>
