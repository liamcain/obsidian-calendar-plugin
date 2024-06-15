[![NPM](https://nodei.co/npm/obsidian-daily-notes-interface.png?mini=true)](https://npmjs.org/package/obsidian-daily-notes-interface)

# Obsidian Daily Notes interface

A collection of utility functions for working with dates and daily notes in Obsidian plugins. It reads from the user's Daily Notes settings to provide a consistent interface.

## Installation

The best way to use this package is to add it to your dependencies:

```
# if you use npm:
npm install --save obsidian-daily-notes-interface

# or if you use Yarn:
yarn add obsidian-daily-notes-interface
```

## Utilities

### createDailyNote

Replicates the Daily Notes plugin in Obsidian but allows creating a note for any day (past or present).

#### Usage

```ts
import { createDailyNote } from 'obsidian-daily-notes-interface';
...
const date = moment();
createDailyNote(date);
```

> Note: if you pass in a past or future date, {{date}} tokens in the user's daily notes template will resolve to the correct date.

### appHasDailyNotesPluginLoaded

Check if the user has the Daily Notes plugin enabled.

### getAllDailyNotes

Returns a map of all daily notes, keyed off by their `dateUID`.

### getDailyNote

Returns the Daily Note for a given `Moment`. For performance reasons, this requires passing in the collection of all daily notes.

### getDailyNoteSettings

Returns the settings stored in the Daily Notes plugin (`format`, `folder`, and `template`).

### getTemplateInfo

Generic utility for reading the contents of a file given it's relative path. This does not apply any transformations.

## FAQ

### What is a `dateUID`?

A `dateUID` uniquely identifies a note, allowing for faster note lookup. It is prefixed by a granularity: `day`, `week`, `month` to allow for additional supporting additional note types (the Calendar plugin uses this for Weekly Notes currently).

### Why do I have to pass in the a map of daily notes to `getDailyNote()`?

This allows you to cache the collection of dailyNotes for a significant speed up.
