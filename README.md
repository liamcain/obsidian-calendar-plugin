# obsidian-calendar-plugin

This plugin for [Obsidian](https://obsidian.md/) creates a simple Calendar view for visualizing and navigating between your daily notes.

![screenshot-full](https://raw.githubusercontent.com/liamcain/obsidian-calendar-plugin/master/images/screenshot-full.png)

## Features

- Go to any **daily note**
- Create new daily notes for days that don't have one. (This is helpful for when you need to backfill old notes or if you're planning ahead for future notes! This will use your current **daily note** template!)
- Visualize your writing. Each day includes a meter to approximate how much you've written that day.

## Customization

The following CSS Variables can be overridden in your `obsidian.css` file.

```css
/* obsidian-calendar-plugin */
/* https://github.com/liamcain/obsidian-calendar-plugin */

#calendar-container {
  --color-background-heading: transparent;

  --color-background-day: transparent;
  --color-background-day-empty: var(--background-secondary-alt);
  --color-background-day-active: var(--interactive-accent);
  --color-background-day-hover: var(--interactive-hover);

  --color-dot: var(--text-muted);
  --color-arrow: currentColor;

  --color-text-title: var(--text-normal);
  --color-text-heading: var(--text-normal);
  --color-text-day: var(--text-normal);
  --color-text-today: var(--text-accent);
}
```

## Compatibility

`obsidian-calendar-plugin` currently requires Obsidian v0.9.9 to work properly.

## Installation

You can install the plugin via the Community Plugins tab within Obsidian. Just search for "Calendar."

### Manual Installation

You can install the plugin manually by downloading the `zip` of the latest Github Release. Unzip the contents into your `<vault>/.obsidian/plugins/obsidian-calendar-plugin` directory. [More info](https://forum.obsidian.md/t/plugins-mini-faq/7737).
