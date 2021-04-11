import { App, PluginSettingTab } from "obsidian";
import type { IDayMetadata } from "obsidian-calendar-ui";
import type { SvelteComponent } from "svelte";

import type CalendarPlugin from "src/index";

import SettingsTab from "./settings/SettingsTab.svelte";

function getSavedSourceSettings(source: IDayMetadata) {
  const blacklistedKeys = [
    "name",
    "description",
    "getMetadata",
    "defaultSettings",
    "registerSettings",
  ];
  return Object.keys(source)
    .filter((key) => !blacklistedKeys.includes(key))
    .reduce((obj, key) => {
      obj[key] = source[key];
      return obj;
    }, {});
}

export default class CalendarSettingsTab extends PluginSettingTab {
  public plugin: CalendarPlugin;

  private view: SvelteComponent;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;

    this.saveAllSourceSettings = this.saveAllSourceSettings.bind(this);
  }

  // call destroy from the plugin
  // close(): void {
  //   super.close();
  //   this.view?.$destroy();
  // }

  async saveAllSourceSettings(sources: IDayMetadata[]): Promise<void> {
    const sourceSettings = sources.reduce((acc, source, i) => {
      acc[source.id] = {
        ...getSavedSourceSettings(source),
        order: i,
      };
      return acc;
    }, {});

    return this.plugin.writeSettingsToDisk(() => ({
      sourceSettings,
    }));
  }

  display(): void {
    this.containerEl.empty();

    this.view = new SettingsTab({
      target: this.containerEl,
      props: {
        saveAllSourceSettings: this.saveAllSourceSettings,
        writeSettingsToDisk: this.plugin.writeSettingsToDisk,
      },
    });
  }
}
