# MVP - Progresso da Agenda

> Branch `main` | 2026-09-02

Este arquivo documenta cada etapa executada do MVP descrito em `PLANO_AGENDA.md`.

## Etapa 1 - Modelo de Dados [CONCLUÍDA]
**Arquivos:**
- `src/events/types.ts:1` - `CalendarEvent`, `EventsRecord`, `RepeatRule`, `SortBy`, `COMMON_TIMEZONES`, `getSystemTimezone()`
- `src/events/utils.ts:1` - `generateId`, `getEventDateTime`, `getTimeUntil`, `formatTimeUntil`, `sortEvents`, `expandRepeatForDate`
- `src/events/store.ts:1` - `eventsStore` (writable + add/update/delete), `eventsCountByDate`

Decisão: armazenamento `Record<YYYY-MM-DD, CalendarEvent[]>` simples, compatível com `saveData` JSON.

## Etapa 2 - Persistência [CONCLUÍDA]
**Arquivos:**
- `src/settings.ts:9` - `ISettings` ampliado com `events`, `defaultEventColor`, `defaultTimezone`, `defaultRemindBefore`, `enableEventNotifications`
- `src/settings.ts:33` - `defaultSettings` tipado
- `src/settings.ts:105+` - nova seção "Agenda / Events" com 4 settings UI
- `src/main.ts:4,31,95` - `eventsStore` sync bidirecional via subscribe + `loadOptions` hidrata store
- `src/ui/stores.ts:60` - `selectedDate` store

## Etapa 3 - Dots Coloridos [CONCLUÍDA]
- `src/ui/sources/events.ts:1` - `eventsSource: ICalendarSource` lê `eventsStore` e gera dots com `color`
- `src/ui/sources/index.ts:5` - export
- `src/view.ts:21,92` - inclui `eventsSource` no array `sources`

## Etapa 4 - Modal de Evento [CONCLUÍDA]
- `src/ui/EventModal.svelte:1` - formulário completo: título*, descrição, horário*, timezone, cor, lembrete, local, pessoas, repetir, email. Usa `svelte/store` settings p/ defaults. Validação título/horário.
- `src/ui/eventModal.ts:1` - `openEventModal(app, dateStr, existing?)` wrapper `Modal` + `EventModalComponent`. Lógica add vs update via `eventsStore`.

## Etapa 5 - Lista Abaixo do Calendário [CONCLUÍDA]
- `src/ui/EventList.svelte:1` - lista do dia selecionado, sort por `timeUntil` (default) ou `name`, countdown via `formatTimeUntil`, nav dia anterior/próximo, botão "+ Novo", empty state, edit/delete. Intervalo 60s atualiza `now`.

## Etapa 6 - Integração Calendar/View [CONCLUÍDA]
- `src/ui/Calendar.svelte:13,28,55` - importa `selectedDate`, `EventList`, `eventsStore`, `startNotifier`; `selectedDateStr` derivado, `handleClickDay` seta `selectedDate`, `tick` reage a `$eventsStore`, inicia notifier se habilitado, renderiza `<EventList>` abaixo.
- `src/view.ts:92` - sources já inclui eventsSource.

## Etapa 7 - Toast e Notifier [CONCLUÍDA]
- `src/ui/toast.ts:1` - `showCalendarToast` com container fixo, animação slide, borderLeftColor, snooze.
- `src/events/notifier.ts:1` - `startNotifier` check a cada 60s, janela `remindAt` -> `eventTime+60s`, deduplicação via `Map`, respeita `enableEventNotifications`.

## Etapa 8 - Tema Obsidian [CONCLUÍDA]
- `styles.css:12` - variáveis `var(--background-primary)` etc., toast e modal seguem tema claro/escuro automaticamente, sem cores hard-coded.
- `Calendar.svelte` e `EventList.svelte` usam `var(--text-normal)` etc.
- Toast usa `var(--font-interface)`.

## Fase 2 - Pós-MVP [CONCLUÍDA 2026-09-02]
- `src/ui/fileMenu.ts:1` - `showDayMenu` com "Adicionar evento" (sempre visível, mesmo sem nota) + `src/view.ts:157` `onContextMenuDay` atualizado
- `src/ui/EventList.svelte:1` - botões `⤓ ICS` por evento e `⤓ ICS` exportar dia todo via `src/integrations/google.ts:19` `downloadICS`
- `src/settings.ts:25,42` - `googleSyncEnabled`, `googleClientId`, `googleCalendarId`, `emailEnabled`, `emailWebhookUrl` + UI `addGoogleSyncSetting`/`addEmailWebhookSetting`
- `src/events/notifier.ts:1` - hook email: se `ev.emailReminder && emailEnabled`, chama `src/integrations/email.ts:12` `sendEmailReminder` via webhook
- `src/events/__tests__/utils.test.ts:1` - 8 testes jest (`formatTimeUntil`, `sortEvents`, `getTimeUntil`) - `npm test` PASS
- `styles.css:12` mantém tema Obsidian

## Fase 3 - Clique e Seleção [CONCLUÍDA 2026-09-02, atualizado 2026-09-03]
- `src/settings.ts:11` `requireCtrlToCreateNote` (default true) + UI `Exigir Ctrl para criar nota`
- `src/view.ts:260` e `src/view.ts:287` só cria daily/weekly note se `Ctrl/Cmd` pressionado quando setting ativo
- `src/ui/sources/selected.ts:1` `selectedDateSource` + `src/view.ts:23` `selectedDateSource` em sources
- `src/ui/Calendar.svelte:35` re-render ao mudar `selectedDate`; `styles.css:34` `.day.agenda-selected` borda `var(--interactive-accent)` seguindo tema
- **Fix 2026-09-03**: `src/ui/sources/selected.ts:9` hoje (`null`) não recebe `agenda-selected`; apenas dia clicado recebe borda; `styles.css:36` `.day.today {outline:none}` + `.day.today.agenda-selected` mantém cor + borda quando hoje é selecionado; `src/ui/Calendar.svelte:31` `selectedDateStr` segue hoje por padrão mas sem borda

## Fase 4 - Drag & Drop e Google OAuth Real [CONCLUÍDA 2026-09-03, atualizado: visão semanal removida a pedido 2026-09-03]
- **Drag & drop** (`src/ui/sources/dragDrop.ts:1` `dragDropSource` com `dataAttributes: {"data-date": YYYY-MM-DD}`, `src/view.ts:22` incluído em sources, `src/events/store.ts:49` `moveEvent(id, fromDate, toDate)`, `src/ui/Calendar.svelte:44` `handleDragOver/handleDragLeave/handleDrop` com `dataTransfer` `text/calendar-event` + highlight `styles.css:38` `.day.drag-over`, `src/ui/EventList.svelte:54` `draggable` + `handleDragStart/handleDragEnd` para calendário)
- **Google OAuth real** (`src/integrations/google.ts:32` `buildGoogleAuthUrl` scope `calendar.events`, `openGoogleAuth`, `syncEventToGoogle` via `POST/PUT https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events` com `Bearer` + `toGooglePayload` (`reminders`, `attendees`, `timeZone`), `validateGoogleToken`; `src/settings.ts:31` `googleAccessToken` + UI `addGoogleSyncSetting` com `Autorizar no Google` + `Validar token` + password field; `src/ui/EventList.svelte:42` `handleSyncGoogle/handleSyncAllGoogle` com `googleEventId` persistido)
- **Visão semanal removida** em 2026-09-03 (`src/ui/WeekView.svelte:1` deletado, removido de `src/ui/Calendar.svelte:15,137`) por causar bug visual no calendário

## Fase 5 - Correção Snooze e Degradê Google [CONCLUÍDA 2026-09-03]
- **Bug adiado**: `src/events/snooze.ts:1` novo store `snoozed` (`SNOOZE_MS=600000`, `snoozeEvent/isSnoozed/clearExpiredSnoozes`); `src/events/notifier.ts:10` usa `snoozeEvent` + `isSnoozed` para não re-notificar; `src/ui/EventList.svelte:1` importa `snoozed`, `isSnoozed/isPast/snoozedLabel` — evento adiado fica `is-snoozed` (opacidade 1, `box-shadow`) e `event-until` mostra `adiado Xmin` em vez de `há Xmin`, não mais `is-past` apagado.
- **Google degradê**: `src/ui/sources/events.ts:19` dots de eventos com `googleEventId` usam `className google-dot` + `#4285F4`; `styles.css:33` `.dot.google-dot {fill:#4285F4 + drop-shadow}`; `src/ui/EventList.svelte:126` `is-google` com `border-image: linear-gradient(#4285F4→#DB4437→#F4B400→#0F9D58)` e `google-badge` G com mesmo degradê, `event-dot` com `linear-gradient(135deg,...)` para atividades puxadas/sincronizadas do Google.

## Verificação
- [x] `npm install` (659 pacotes)
- [x] `npx eslint . --ext .ts` 0 errors
- [x] `rollup -c` `created main.js in 4.1s`
- [x] `npm test` 8 passed
- [x] Teste manual: clique seleciona com borda (hoje só cor), Ctrl+clique cria nota, evento/dot/sort/toast/ICS/context menu, drag & drop entre dias (calendário), Google sync com token (validado), snooze não apaga evento (fica destacado), Google com degradê
- [x] Tema claro/escuro OK (variáveis CSS)
- [x] Branch `main` (antes `master`), `PLANO_AGENDA.md:1` e `README.md:1` atualizados
