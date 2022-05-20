import { App, PluginSettingTab } from "obsidian";
import type { SvelteComponent } from "svelte";

import type CalendarPlugin from "src/main";

import Router from "./settings/Router.svelte";

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

  display(): void {
    this.containerEl.empty();

    this.view = new Router({
      target: this.containerEl,
      props: {
        app: this.plugin.app,
        plugin: this.plugin,
      },
    });
  }
}
