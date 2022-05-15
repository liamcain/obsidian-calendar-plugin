import { App, PluginSettingTab } from "obsidian";
import type { SvelteComponent } from "svelte";

import type CalendarPlugin from "src/main";

import SettingsTab from "./settings/SettingsTab.svelte";

// function getSavedSourceSettings(source: IDayMetadata) {
//   const blacklistedKeys = [
//     "name",
//     "description",
//     "getMetadata",
//     "defaultSettings",
//     "registerSettings",
//   ];
//   return Object.keys(source)
//     .filter((key) => !blacklistedKeys.includes(key))
//     .reduce((obj, key) => {
//       obj[key] = source[key];
//       return obj;
//     }, {});
// }

export default class CalendarSettingsTab extends PluginSettingTab {
  public plugin: CalendarPlugin;

  private view: SvelteComponent;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // call destroy from the plugin
  hide(): void {
    super.hide();
    this.view?.$destroy();
  }

  // async saveAllSourceSettings(sources: IDayMetadata[]): Promise<void> {
  //   const sourceSettings = sources.reduce((acc, source, i) => {
  //     acc[source.id] = {
  //       ...getSavedSourceSettings(source),
  //       order: i,
  //     };
  //     return acc;
  //   }, {});

  //   return this.plugin.writeSettingsToDisk(() => ({
  //     sourceSettings,
  //   }));
  // }

  display(): void {
    this.containerEl.empty();

    this.view = new SettingsTab({
      target: this.containerEl,
      props: {
        app: this.plugin.app,
        plugin: this.plugin,
      },
    });
  }
}
