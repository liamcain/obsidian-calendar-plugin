<svelte:options immutable={false} />

<script lang="ts">
  import type { CalendarEvent, RepeatRule } from "src/events/types";
  import { COMMON_TIMEZONES, REPEAT_OPTIONS, REMIND_OPTIONS, DEFAULT_EVENT_COLOR, getSystemTimezone } from "src/events/types";
  import { get } from "svelte/store";
  import { settings } from "./stores";

  export let dateStr: string;
  export let event: CalendarEvent | null = null;
  export let onSave: (ev: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  export let onClose: () => void;

  const isEdit = !!event;

  // defaults from settings + event
  const defaults = get(settings);
  let title = event?.title ?? "";
  let description = event?.description ?? "";
  let time = event?.time ?? window.moment().format("HH:mm");
  let timezone = event?.timezone ?? defaults.defaultTimezone ?? getSystemTimezone();
  let color = event?.color ?? defaults.defaultEventColor ?? DEFAULT_EVENT_COLOR;
  let location = event?.location ?? "";
  let attendeesStr = event?.attendees?.join(", ") ?? "";
  let remindBeforeMinutes: number = event?.remindBeforeMinutes ?? defaults.defaultRemindBefore ?? 15;
  let repeat: RepeatRule = event?.repeat ?? "none";
  let emailReminder = event?.emailReminder ?? false;

  let error = "";

  function handleSave() {
    if (!title.trim()) {
      error = "Título é obrigatório.";
      return;
    }
    if (!time) {
      error = "Horário é obrigatório.";
      return;
    }
    const attendees = attendeesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      id: event?.id,
      date: dateStr,
      title: title.trim(),
      description: description.trim(),
      time,
      timezone,
      color,
      location: location.trim(),
      attendees,
      remindBeforeMinutes,
      repeat,
      emailReminder,
      googleEventId: event?.googleEventId,
      repeatUntil: event?.repeatUntil,
    });
  }
</script>

<div class="calendar-event-modal">
  <h2>{isEdit ? "Editar evento" : "Novo evento"} — {dateStr}</h2>
  {#if error}
    <div class="calendar-error">{error}</div>
  {/if}

  <div class="calendar-field">
    <label>Título *</label>
    <input type="text" bind:value={title} placeholder="Ex: Reunião com equipe" />
  </div>

  <div class="calendar-field">
    <label>Descrição</label>
    <textarea bind:value={description} placeholder="Detalhes do evento..." rows="3"></textarea>
  </div>

  <div class="calendar-row">
    <div class="calendar-field half">
      <label>Horário *</label>
      <input type="time" bind:value={time} />
    </div>
    <div class="calendar-field half">
      <label>Fuso horário</label>
      <select bind:value={timezone}>
        {#each COMMON_TIMEZONES as tz}
          <option value={tz}>{tz === "system-default" ? `Sistema (${getSystemTimezone()})` : tz}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="calendar-row">
    <div class="calendar-field half">
      <label>Cor</label>
      <div class="calendar-color-row">
        <input type="color" bind:value={color} />
        <span class="calendar-color-preview" style="background: {color}"></span>
        <span class="calendar-color-hex">{color}</span>
      </div>
    </div>
    <div class="calendar-field half">
      <label>Lembrete</label>
      <select bind:value={remindBeforeMinutes}>
        {#each REMIND_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="calendar-field">
    <label>Local</label>
    <input type="text" bind:value={location} placeholder="Ex: Sala 3, Zoom, Café ..." />
  </div>

  <div class="calendar-field">
    <label>Pessoas</label>
    <input type="text" bind:value={attendeesStr} placeholder="Separe por vírgula: João, Maria, joao@email.com" />
  </div>

  <div class="calendar-row">
    <div class="calendar-field half">
      <label>Repetir</label>
      <select bind:value={repeat}>
        {#each REPEAT_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div class="calendar-field half">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={emailReminder} />
        Enviar por email (requer config)
      </label>
      <div class="setting-item-description">Integração futura com Email / Google Agenda</div>
    </div>
  </div>

  <div class="modal-button-container">
    <button on:click={onClose}>Cancelar</button>
    <button class="mod-cta" on:click={handleSave}>{isEdit ? "Salvar" : "Criar"}</button>
  </div>
</div>

<style>
  .calendar-event-modal { padding: 0.5em 0; }
  .calendar-event-modal h2 { margin-top: 0; font-size: 1.1em; color: var(--text-normal); }
  .calendar-field { display:flex; flex-direction:column; margin-bottom: 0.8em; }
  .calendar-field label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); margin-bottom: 0.3em; }
  .calendar-field input[type="text"], .calendar-field input[type="time"], .calendar-field select, .calendar-field textarea {
    background: var(--background-primary);
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 6px 8px;
  }
  .calendar-row { display:flex; gap: 0.8em; }
  .calendar-row .half { flex:1; }
  .calendar-color-row { display:flex; align-items:center; gap:0.5em; }
  .calendar-color-preview { width:22px; height:22px; border-radius:50%; border:1px solid var(--background-modifier-border); }
  .calendar-color-hex { font-size:0.8em; color: var(--text-muted); }
  .calendar-error { background: var(--background-modifier-error); color: var(--text-on-accent); padding:0.6em; border-radius:4px; margin-bottom:0.8em; }
  .checkbox-label { display:flex; align-items:center; gap:0.4em; font-weight: normal !important; color: var(--text-normal) !important; }
  .modal-button-container { display:flex; justify-content:flex-end; gap:0.6em; margin-top:1em; }
</style>
