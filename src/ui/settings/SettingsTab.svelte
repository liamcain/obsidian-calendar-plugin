<script lang="ts">
  import type { ICalendarSource } from "obsidian-calendar-ui";

  import type { ISettings } from "src/settings";

  import SettingItem from "./SettingItem.svelte";
  import Sources from "./Sources.svelte";
  import Dropdown from "./controls/Dropdown.svelte";
  import Toggle from "./controls/Toggle.svelte";

  export let saveAllSourceSettings: (sources: ICalendarSource[]) => void;
  export let writeSettingsToDisk: (
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ) => Promise<void>;

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const localizedWeekdays = window.moment.weekdays();
  const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;
  const localeWeekStart = localizedWeekdays[localeWeekStartNum];
  const weekStartOptions = [
    { label: `Locale default (${localeWeekStart})`, value: "locale" },
    ...localizedWeekdays.map((day, i) => ({ value: weekdays[i], label: day })),
  ];
</script>

<div>
  <h3>General Settings</h3>
  <SettingItem
    name="Confirm before creating new note"
    description="Show a confirmation modal before creating a new note"
  >
    <Toggle slot="control" name="shouldConfirmBeforeCreate" />
  </SettingItem>
  <SettingItem
    name="Show week numbers"
    description="Enable this to add a column with the week number"
  >
    <Toggle slot="control" name="showWeeklyNote" />
  </SettingItem>

  <h3>Sources</h3>
  <div class="setting-item-description">
    Configure what appears on the calendar and what shows in the hover menu.
    Drag to reorder.
  </div>
  <Sources {saveAllSourceSettings} {writeSettingsToDisk} />

  <h3>Localization</h3>
  <SettingItem
    name="Start week on"
    description="Choose what day of the week to start. Select 'locale default' to use the default specified by moment.js"
  >
    <Dropdown slot="control" options={weekStartOptions} />
  </SettingItem>
</div>
