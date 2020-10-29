# obsidian-calendar-plugin

This plugin for [Obsidian](https://obsidian.md/) creates a simple Calendar view for visualizing and navigating between your daily notes.

![screenshot-full](/images/screenshot-full.png)

## Features

- Go to any **daily note**
- Create new daily notes for days that don't have one.
  > Helpful for when you need to backfill old notes or if you're planning ahead for future notes! This will use your current **daily note** template!
- Visualize your writing. Each day includes a meter to approximate how much you've written that day.

## Customization

The following CSS Variables can be overridden in your `obsidian.css` file.

```css
#calendar-container {
  --color-border: #2e3440;
  --color-hover: #3b4252;
  --color-empty: #434c5e;
  --color-dot: #81a1c1;
  --color-active: #bf616a;
  --color-today: rgb(72, 54, 153);
}
```
