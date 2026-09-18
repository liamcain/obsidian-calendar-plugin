# Plano: Transformar `obsidian-calendar-plugin` em Agenda com Eventos

> Branch: `main` | Tema: segue o tema do Obsidian (variáveis CSS nativas)
> Autor: análise feita em 2026-09-02, atualizado 2026-09-03 dentro de `/home/pedrovsd/Códigos/obsidian-calendar-plugin`

## 1. Diagnóstico Atual

- Plugin é apenas View (`src/main.ts:21`, `src/view.ts:27`) que renderiza `obsidian-calendar-ui` (`src/ui/Calendar.svelte:9`) como wrapper fino. `CalendarBase` é externo (`0.3.12`) e não persiste nada além de navegação de daily/weekly notes.
- Estado global via Svelte stores: `src/ui/stores.ts:56` (`settings`, `dailyNotes`, `weeklyNotes`, `activeFile`). Não existe modelo de Evento.
- Persistência via `Plugin.loadData/saveData` em `src/main.ts:95,111` + `ISettings` em `src/settings.ts:9`. Extensível, mas hoje só guarda UI prefs.
- Estilo mínimo em `styles.css:1` - sem sistema de toast/notificação.
- Sem scheduler, sem timezone, sem integração externa.

**Conclusão:** feature é greenfield. Requer novo domínio `events` isolado do `dailyNotes`.

## 2. Requisitos do Solicitante

1. Adicionar eventos em qualquer dia (click no calendário).
2. Campos: nome (título), descrição, horário de disparo, fuso horário configurável, cor do lembrete, local, pessoas/attendees, notificação X minutos antes, repetir (recorrência).
3. Lista abaixo do calendário: eventos do dia selecionado, ordenável por `nome` ou `tempo até o evento`.
4. Toast elegante para notificação.
5. Integração opcional Google Agenda e envio por email.
6. Tema deve seguir o tema do Obsidian.

## 3. Modelo de Dados Proposto

Novo arquivo `src/events/types.ts`:

```ts
type RepeatRule = "none" | "daily" | "weekly" | "monthly" | "yearly";

interface CalendarEvent {
  id: string; // uuid
  date: string; // YYYY-MM-DD (chave do dia)
  title: string;
  description?: string;
  time: string; // HH:mm
  timezone: string; // ex: America/Sao_Paulo, default = Intl.DateTimeFormat().resolvedOptions().timeZone
  color: string; // hex, default var(--interactive-accent)
  location?: string;
  attendees?: string[]; // nomes/emails
  remindBeforeMinutes: number; // 0,5,10,15,30,60...
  repeat: RepeatRule;
  repeatUntil?: string; // YYYY-MM-DD
  googleEventId?: string;
  emailReminder?: boolean;
  createdAt: number;
  updatedAt: number;
}
```

`ISettings` ampliado (`src/settings.ts:9`) com:

```ts
events: Record<string, CalendarEvent[]>
defaultTimezone: string
defaultColor: string
defaultRemindBefore: number
googleSyncEnabled?: boolean
emailConfig?: { enabled: boolean, service: string }
```

Persistência: manter em `loadData` já existente. Migração defensiva para `defaultSettings` (`src/settings.ts:33`). Alternativa (descartada para MVP): salvar em `calendar-events.json` no vault.

## 4. Arquitetura / Onde Mexer

### Fase 1 - Core (MVP local, sem integrações externas)
1. `src/events/store.ts` - Svelte `writable` + derivados `eventsForSelectedDate`, lógica `add/update/delete`, validações. `loadEvents` chamado em `src/main.ts:73` dentro `loadOptions`.
2. `src/events/utils.ts` - helpers `getTimeUntil(event)`, `sortEvents(events, sortBy)`, `isOverdue`, `nextOccurrence`.
3. `src/events/types.ts` - tipos acima.
4. `src/ui/EventModal.svelte` + `src/ui/EventModal.ts` (classe `Modal` Obsidian) - Formulário completo. Reusa padrão `src/ui/modal.ts:11`.
5. `src/ui/EventList.svelte` - Lista abaixo do calendário, para `selectedDate` (novo store `selectedDate` em `src/ui/stores.ts:60`). Ordenação por botões. Cada item: bolinha cor, hora, título, countdown, ações edit/delete.
6. `src/ui/Calendar.svelte:56` - Envelopar `CalendarBase` + `EventList`. Expor `selectedDate` e injetar `dots` com cor via novo `eventsSource: ICalendarSource` em `src/ui/sources/events.ts` (igual `src/ui/sources/tasks.ts:38`).
7. `src/view.ts:102` - `onClickDay` seta `selectedDate` antes/depois de `openOrCreateDailyNote`. Adicionar `onAddEvent`.

### Fase 2 - Notificações / UX
8. `src/events/notifier.ts` - `setInterval` 60s (similar `Calendar.svelte:40` heartbeat) checa `events` vs `now` + `remindBeforeMinutes` + timezone (`moment`). Dispara `src/ui/toast.ts`.
9. `src/settings.ts:53` - Nova seção `Event Settings` -> timezone padrão, cor padrão, habilitar toast.

### Fase 3 - Integrações (feature-flag)
10. Google Agenda: Opções (a) Exportar `.ics` e importar manualmente (simples, sem auth). (b) OAuth via `fetch` + `https://www.googleapis.com/calendar/v3` (requer `client_id` do usuário). Criar `src/integrations/google.ts`. **Recomendação: começar com (a), deixar (b) para v2.**
11. Email: Obsidian não envia email nativo. Opções: `EmailJS`, SMTP webhook, `n8n`. Proposta: campo SMTP em settings + `fetch` para serviço externo. Para MVP, simular com `Notice` + log.

## 5. Fluxo UI Detalhado

- Click em dia -> `selectedDate.set(date)` -> `EventList` atualiza; apenas dia clicado ganha borda `agenda-selected` (`src/ui/sources/selected.ts:9`), hoje só cor sem borda (`styles.css:36`).
- Botão `+` no header da lista / duplo-click no dia / context menu `src/ui/fileMenu.ts:3` -> abre `EventModal`.
- Toast: canto inferior direito, `position: fixed`, animação slide-in, auto-dismiss 5s, botão "Adiar 10m" / "Dispensar".
- Ordenação: toggle `Nome A-Z` vs `Proximidade` (calcula `moment.tz` diff).
- Drag & drop: arrastar card do `EventList` (`draggable` em `src/ui/EventList.svelte:54`) para célula do calendário (`src/ui/sources/dragDrop.ts:1` `data-date`) chama `eventsStore.moveEvent`.

## 6. Fuso Horário

Usar `moment-timezone` ou `Intl`. Hoje `package.json:32` usa `moment 2.29.1` sem tz. MVP usa `Intl.DateTimeFormat().resolvedOptions().timeZone` e lista curta de timezones comuns + `moment` para diff. Adição futura: `moment-timezone` em `rollup.config.js:15`.

## 7. Tema Obsidian

Todo CSS usa variáveis nativas:

```css
--background-primary, --background-secondary, --text-normal,
--text-muted, --interactive-accent, --background-modifier-border
```

Nenhuma cor hardcoded que quebre tema claro/escuro. Toast e EventList herdam `var(--background-primary)` e `var(--text-normal)`. Cores de evento só nos dots/bordas.

## 8. Ideias Adicionais Sugeridas

- [x] Drag & drop para mover evento entre dias. [IMPLEMENTADO 2026-09-03]
- Filtro por cor/categoria e busca.
- Marcar como concluído (check).
- Indicador "hoje tem N eventos" no `dots` com número.
- Sincronia com tasks `- [ ] 10:00 Reunião` do daily note (parse frontmatter `events:`).
- Exportar agenda do dia para daily note com `{{events}}` template tag.
- Visão semanal de eventos. [REMOVIDA 2026-09-03 a pedido - bug visual]

## 9. Riscos / Decisões

- **Storage bloat:** `saveData` é JSON único; ok até ~5k eventos.
- **Mobile:** Notificações background limitadas; toast só com app aberto.
- **Google/Email requer segredo:** não commitar `client_secret`; instruir usuário a criar projeto GCP.
- **Compatibilidade `obsidian-calendar-ui 0.3.12`:** API `ICalendarSource` estável, verificar `IDayMetadata.dots` com `color`.
- **Timezone:** sem `moment-timezone`, diff pode ser impreciso em DST.

## 10. Roadmap MVP (esta branch)

| Etapa | Arquivos | Status |
|-------|----------|--------|
| 1 | `src/events/types.ts`, `store.ts`, `utils.ts` | CONCLUÍDO |
| 2 | `src/settings.ts`, `src/main.ts` persistência | CONCLUÍDO |
| 3 | `src/ui/sources/events.ts` | CONCLUÍDO |
| 4 | `src/ui/EventModal.svelte` | CONCLUÍDO |
| 5 | `src/ui/EventList.svelte` | CONCLUÍDO |
| 6 | `src/ui/Calendar.svelte`, `src/view.ts`, `src/ui/stores.ts` | CONCLUÍDO (fix 2026-09-03: hoje sem borda, só dia clicado com `agenda-selected`) |
| 7 | `src/events/notifier.ts`, `src/ui/toast.ts` | CONCLUÍDO |
| 8 | `styles.css` (tema) | CONCLUÍDO |
| 9 | Testes `jest --passWithNoTests` + `npm run build` | CONCLUÍDO (8 testes) |
| 10 | `src/ui/sources/dragDrop.ts`, `src/events/store.ts:moveEvent` (drag & drop) | CONCLUÍDO 2026-09-03 |
| 11 | `src/integrations/google.ts` Google OAuth real (API v3) | CONCLUÍDO 2026-09-03 |
| 12 | Documentação `README.md`, `MVP_PROGRESS.md` | ATUALIZADO 2026-09-03 (visão semanal removida) |

## 11. Verificação

- `npm run lint && rollup -c` deve passar. [2026-09-03: `created main.js in ~3.6s`, `eslint` 0 erros]
- Teste manual: criar evento, trocar dia, ordenar, verificar dot colorido, aguardar toast, drag & drop entre dias (calendário), Google sync com token, hoje sem borda só cor.
- Teste de tema: alternar tema claro/escuro do Obsidian, verificar contraste.

---
*Documentado em 2026-09-02, atualizado 2026-09-03 - Branch `main`*
