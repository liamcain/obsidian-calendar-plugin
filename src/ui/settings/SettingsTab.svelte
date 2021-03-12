<script lang="ts">
  import type { ICalendarSource } from "obsidian-calendar-ui";

  import type { ISettings } from "src/settings";

  import SettingItem from "./SettingItem.svelte";
  import Sources from "./Sources.svelte";
  import Dropdown from "./controls/Dropdown.svelte";
  import Toggle from "./controls/Toggle.svelte";

  export let saveAllSourceSettings: (sources: ICalendarSource[]) => void;
  export let writeOptions: (
    changeOpts: (settings: ISettings) => Partial<ISettings>
  ) => Promise<void>;
</script>

<div>
  <h3>General Settings</h3>
  <SettingItem
    name="Confirm before creating new note"
    description="Show a confirmation modal before creating a new note"
  >
    <Toggle slot="control" />
  </SettingItem>

  <h3>Sources</h3>
  <div class="setting-item-description">
    Configure what appears on the calendar and what shows in the hover menu.
    Drag to reorder.
  </div>
  <Sources {saveAllSourceSettings} {writeOptions} />

  <h3>Localization</h3>
  <SettingItem
    name="Start week on"
    description="Choose what day of the week to start. Select 'locale default' to use the default specified by moment.js"
  >
    <Dropdown slot="control" options={[]} />
  </SettingItem>
</div>
