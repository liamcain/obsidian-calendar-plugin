<script lang="ts">
  import { App } from "obsidian";
  import type { ICalendarSource, IWeekStartOption } from "obsidian-calendar-ui";
  import { writable } from "svelte/store";

  import {
    getLocalizationSettings,
    type ILocaleOverride,
  } from "src/localization";
  import { getLocaleOptions, getWeekStartOptions } from "src/localization";
  import CalendarPlugin from "src/main";
  import type { IWeekNumberingPreference } from "src/settings";

  import Dropdown from "./controls/Dropdown.svelte";
  import Footer from "./Footer.svelte";
  import SettingItem from "./SettingItem.svelte";
  import Sources from "./Sources.svelte";
  import Toggle from "./controls/Toggle.svelte";
  import IconButton from "./IconButton.svelte";

  export let app: App;
  export let plugin: CalendarPlugin;
  let registeredSources = plugin.registeredSources;

  const weekNumberingOptions = [
    { label: "ISO-8601 numbers", value: "iso-8601" },
    { label: "Locale-aware numbers", value: "locale" },
  ];

  let localization = writable(getLocalizationSettings(app));
  let settings = plugin.settings;

  function setWeekStart(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    $localization.weekStart = val as IWeekStartOption;
    app.vault.setConfig("weekStart", val);
  }

  function setLocaleOverride(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    $localization.localeOverride = val as ILocaleOverride;
    app.vault.setConfig("localeOverride", val);
  }

  function setWeekNumberingPreference(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    $settings.weekNumberingPreference = val as IWeekNumberingPreference;
  }

  function resetSources() {
    //
  }
</script>

<div>
  <h3>General Settings</h3>
  <SettingItem
    name="Confirm before creating new note"
    description="Show a confirmation modal before creating a new note"
    type="toggle"
  >
    <Toggle
      slot="control"
      isEnabled={$settings.shouldConfirmBeforeCreate}
      onChange={(val) => ($settings.shouldConfirmBeforeCreate = val)}
    />
  </SettingItem>
  <SettingItem
    name="Show week numbers"
    description="Enable this to add a column with the week number"
    type="toggle"
  >
    <Toggle
      slot="control"
      isEnabled={$settings.showWeeklyNote}
      onChange={(val) => ($settings.showWeeklyNote = val)}
    />
  </SettingItem>
  {#if $settings.showWeeklyNote}
    <SettingItem
      name="Week Number Format"
      description="ISO week numbers are part of the ISO-8601 date and time standard. It offers the best compatibility with other calendar applications, like Google Calendar. Some calendar apps, like Apple Calendar, use locale week numbering."
      type="dropdown"
    >
      <Dropdown
        slot="control"
        options={weekNumberingOptions}
        value={$settings.weekNumberingPreference}
        onChange={setWeekNumberingPreference}
      />
    </SettingItem>
  {/if}

  <div class="setting-item setting-item-heading">
    <div class="setting-item-info">
      <h3 class="setting-item-name">Sources</h3>
      <div class="setting-item-description">
        Configure what appears on the calendar and what shows in the hover menu.
        Drag to reorder.
      </div>
    </div>
    <div class="setting-item-control">
      <div class="setting-editor-extra-setting-button clickable-icon">
        <IconButton iconType="reset" size={16} onClick={resetSources} />
      </div>
    </div>
  </div>

  <Sources {registeredSources} {settings} />

  <div class="setting-item setting-item-heading">
    <div class="setting-item-info">
      <h3 class="setting-item-name">Localization</h3>
      <div class="setting-item-description">
        These settings are applied to your entire vault, meaning the values you
        specify here may impact other plugins as well.
      </div>
    </div>
  </div>
  <SettingItem
    name="Start week on"
    description="Choose what day of the week to start. Select 'locale default' to use the default specified by moment.js"
    type="dropdown"
  >
    <Dropdown
      slot="control"
      options={getWeekStartOptions()}
      value={$localization.weekStart}
      onChange={setWeekStart}
    />
  </SettingItem>

  <SettingItem
    name="Locale"
    description="Override the locale used by the calendar and other plugins"
    type="dropdown"
  >
    <Dropdown
      slot="control"
      options={getLocaleOptions()}
      value={$localization.localeOverride}
      onChange={setLocaleOverride}
    />
  </SettingItem>

  <Footer />
</div>

<style>
  .setting-item {
    align-items: baseline;
  }

  .setting-item-name {
    margin-bottom: 0.25em;
  }
</style>
