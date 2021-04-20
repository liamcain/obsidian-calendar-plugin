import type { TFile } from "obsidian";
import { get, writable } from "svelte/store";

import { defaultSettings, ISettings } from "src/settings";

import { getDateUIDFromFile } from "./utils";
import type { ICalendarSource } from "obsidian-calendar-ui";

function createSettingsStore() {
  const store = writable<ISettings>(defaultSettings);
  return {
    getSourceSettings: <T>(sourceId: string): T => {
      const defaultSourceSettings = ((get(sources).find(
        (source) => source.id === sourceId
      )?.defaultSettings || {}) as unknown) as T;
      const userSettings = ((get(store).sourceSettings[sourceId] ||
        {}) as unknown) as T;

      return {
        ...defaultSourceSettings,
        ...userSettings,
      };
    },

    ...store,
  };
}
export const settings = createSettingsStore();

function createSelectedFileStore() {
  const store = writable<string>(null);

  return {
    setFile: (file: TFile) => {
      const id = getDateUIDFromFile(file);
      store.set(id);
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();

function createSourcesStore() {
  const store = writable<ICalendarSource[]>([]);

  return {
    registerSource: (source: ICalendarSource) => {
      store.update((val: ICalendarSource[]) => {
        val.push(source);
        return val;
      });
      settings.update((existingSettings) => {
        existingSettings.sourceSettings[source.id] = settings.getSourceSettings(
          source.id
        );
        return existingSettings;
      });
    },
    ...store,
  };
}
export const sources = createSourcesStore();
