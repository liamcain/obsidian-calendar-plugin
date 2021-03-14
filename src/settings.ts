import { App, PluginSettingTab } from "obsidian";
import type {
  IDayMetadata,
  ILocaleOverride,
  ISourceSettings,
  IWeekStartOption,
} from "obsidian-calendar-ui";
import type { SvelteComponent } from "svelte";

import { DEFAULT_WORDS_PER_DOT } from "src/constants";

import SettingsTab from "./ui/settings/SettingsTab.svelte";
import type CalendarPlugin from "./index";

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;

  // Weekly Note settings
  showWeeklyNote: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;

  localeOverride: ILocaleOverride;

  sourceSettings: Record<string, ISourceSettings>;
}

export const defaultSettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  weekStart: "locale" as IWeekStartOption,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default",

  sourceSettings: {},
});

export function appHasPeriodicNotesPluginLoaded(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (<any>window.app).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.weekly?.enabled;
}

export class CalendarSettingsTab extends PluginSettingTab {
  public plugin: CalendarPlugin;

  private view: SvelteComponent;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;

    this.saveAllSourceSettings = this.saveAllSourceSettings.bind(this);
  }

  close(): void {
    super.close();
    this.view?.$destroy();
  }

  async saveAllSourceSettings(sources: IDayMetadata[]): Promise<void> {
    const sourceSettings = sources.reduce((acc, source, i) => {
      acc[source.id] = {
        ...source,
        order: i,
      };
      return acc;
    }, {});

    // settings.update((oldSettings: ISettings) => ({
    //   ...oldSettings,
    //   sourceSettings,
    // }));

    return this.plugin.writeOptions(() => ({
      sourceSettings,
    }));
  }

  display(): void {
    this.containerEl.empty();

    this.view = new SettingsTab({
      target: this.containerEl,
      props: {
        saveAllSourceSettings: this.saveAllSourceSettings,
        writeOptions: this.plugin.writeOptions,
      },
    });
  }
}
