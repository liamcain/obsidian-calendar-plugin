import type { TFile } from "obsidian";
import type { ICalendarSource } from "obsidian-calendar-ui";
import { get, writable } from "svelte/store";

import { DEFAULT_SETTINGS, type ISettings } from "src/settings";

export function createSettingsStore() {
  const store = writable<ISettings>(DEFAULT_SETTINGS);
  return {
    getSourceSettings: <T>(sourceId: string): T => {
      const defaultSourceSettings = (get(sources).find((source) => source.id === sourceId)
        ?.defaultSettings || {}) as unknown as T;
      const userSettings = (get(store).sourceSettings[sourceId] || {}) as unknown as T;

      return {
        ...defaultSourceSettings,
        ...userSettings,
      };
    },

    ...store,
  };
}

export function createActiveFileStore() {
  return writable<TFile | undefined>();
}

function createSourcesStore() {
  const store = writable<ICalendarSource[]>([]);

  return {
    registerSource: (source: ICalendarSource) => {
      store.update((val: ICalendarSource[]) => {
        val.push(source);
        return val;
      });
      // settings.update((existingSettings) => {
      //   existingSettings.sourceSettings[source.id] = settings.getSourceSettings(
      //     source.id
      //   );
      //   return existingSettings;
      // });
    },
    ...store,
  };
}
