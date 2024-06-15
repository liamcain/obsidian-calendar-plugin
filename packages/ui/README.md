# `obsidian-calendar-ui`

The UI package that powers the [Obsidian Calendar plugin](https://github.com/liamcain/obsidian-calendar-plugin).

## The problem

You want a drop-in calendar widget for your Obsidian plugin that seamlessly blends with the user's theme, provides localization that matches the user's locale and language settings, and you don't want to learn about all intracasies of week numbers.

## The solution

This package provides an out-of-the-box calendar view for Obsidian plugins. Built using Obsidian's CSS variables, it will match any theme or custom styling that the user has configured. It also syncs with the user's locale, meaning settings like `Week Start`, and `Week number` come preconfigured. Finally, the interface is generic so you can use it for any use case that you might have.

## Basic Usage

### Standalone Component

You can render the component anywhere you would like in the DOM by initializing
it with a `target` element.

```ts
// const contentEl = ...;
this.calendar = new Calendar({
  target: contentEl, // the HTML element you're attaching it to
  props: {
    // Settings
    showWeekNums: boolean;

    // Localization
    localeOverride: ILocaleOverride;
    weekStart: IWeekStartOption;

    // Event Handlers
    onHoverDay?: (date: Moment, targetEl: EventTarget) => void;
    onHoverWeek?: (date: Moment, targetEl: EventTarget) => void;
    onClickDay?: (date: Moment, isMetaPressed: boolean) => void;
    onClickWeek?: (date: Moment, isMetaPressed: boolean) => void;
    onContextMenuDay?: (date: Moment, event: MouseEvent) => boolean;
    onContextMenuWeek?: (date: Moment, event: MouseEvent) => boolean;

    // External sources
    selectedId?: string | null;
    sources?: ICalendarSource[];

    // Override-able local state
    today?: Moment;
    displayedMonth?: Moment;
  },
});
```

### Within a Svelte component

If you are building a plugin using Svelte.js, you can also render the calendar as a subcomponent. The calendar plugin uses this approach:

```svelte
<Calendar
  localeOverride={$settings.localeOverride}
  weekStart={$settings.weekStart}
  {sources}
  {today}
  {onHoverDay}
  {onHoverWeek}
  {onContextMenuDay}
  {onContextMenuWeek}
  {onClickDay}
  {onClickWeek}
  bind:displayedMonth
  selectedId={$activeFile}
  showWeekNums={$settings.showWeeklyNote}
/>
```

## Calendar Sources

If you want to attach metadata to the calendar (e.g. adding classes or dots to a particular day, you'll need to provide a calendar source. A calendar source has the following interface:

```ts
export interface ICalendarSource {
  getDailyMetadata?: (date: Moment) => Promise<IDayMetadata>;
  getWeeklyMetadata?: (date: Moment) => Promise<IDayMetadata>;
}

export interface IDayMetadata {
  classes?: string[];
  dataAttributes?: Record<string, string>;
  dots?: IDot[];
}
```

For reference, the calendar plugin has the following Calendar Sources:

- `tasks`: Creates hollow dots on days with `- [ ]` in them
- `wordCount`: Creates dots based on the wordcount of a daily note
- `tags`: Attaches `[data-tags]` for frontmatter tags within a daily note

The calendar plugin relies heavily on "Daily Notes" but because this interface is generic, you're plugin doesn't need to. This unlocks the ability to use the calendar UI with any source, be it a flat Markdown file, or Google Calendar.
