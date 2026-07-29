/**
 * StatusConfigStore — loads and saves the status configuration to plugin data.json.
 * Manages preset status tags, custom status tags, and alias mappings.
 */

import { App } from "obsidian";
import { STATUS_PRESETS, MOOD_PRESETS, type IStatusPreset, type IMoodPreset } from "./presets";

export interface ICustomStatus {
  id: string;
  label: { zh: string; en: string };
  emoji: string;
  color: string;
  category: "work" | "study" | "life" | "festival";
  aliases: string[];
}

export interface IStatusConfig {
  version: number;
  // User customizations for preset tags (color/emoji/aliases overrides)
  presetOverrides: Record<string, Partial<IStatusPreset>>;
  // User-defined custom status tags
  custom: Record<string, ICustomStatus>;
  // User-defined extra aliases (alias -> canonicalId)
  userAliases: Record<string, string>;
  // Disabled preset IDs
  disabledPresets: string[];
}

export interface IMoodConfig {
  version: number;
  presetOverrides: Record<string, Partial<IMoodPreset>>;
  userAliases: Record<string, string>;
}

export class StatusConfigStore {
  private app: App;
  private config: IStatusConfig;
  private moodConfig: IMoodConfig;
  private loaded = false;

  constructor(app: App) {
    this.app = app;
    this.config = this.defaultConfig();
    this.moodConfig = this.defaultMoodConfig();
  }

  private defaultConfig(): IStatusConfig {
    return {
      version: 1,
      presetOverrides: {},
      custom: {},
      userAliases: {},
      disabledPresets: [],
    };
  }

  private defaultMoodConfig(): IMoodConfig {
    return {
      version: 1,
      presetOverrides: {},
      userAliases: {},
    };
  }

  async load(): Promise<void> {
    try {
      // @ts-ignore - internal API
      const data = this.app.plugins?.plugins?.["calendar"]?.instance?.data;
      if (data?.statusConfig) {
        this.config = { ...this.defaultConfig(), ...data.statusConfig };
      }
      if (data?.moodConfig) {
        this.moodConfig = { ...this.defaultMoodConfig(), ...data.moodConfig };
      }
    } catch (e) {
      console.warn("[Calendar+] Failed to load status config:", e);
    }
    this.loaded = true;
  }

  async save(): Promise<void> {
    try {
      // @ts-ignore - internal API
      const plugin = this.app.plugins?.plugins?.["calendar"];
      if (plugin?.instance?.data) {
        plugin.instance.data.statusConfig = this.config;
        plugin.instance.data.moodConfig = this.moodConfig;
        // @ts-ignore
        await plugin.instance.saveData();
      }
    } catch (e) {
      console.warn("[Calendar+] Failed to save status config:", e);
    }
  }

  /** Get all active status presets (with user overrides applied) */
  getActivePresets(): IStatusPreset[] {
    return STATUS_PRESETS
      .filter(p => !this.config.disabledPresets.includes(p.id))
      .map(p => {
        const override = this.config.presetOverrides[p.id];
        return override ? { ...p, ...override } : p;
      });
  }

  /** Get all custom statuses */
  getCustomStatuses(): ICustomStatus[] {
    return Object.values(this.config.custom);
  }

  /** Get all active status entries (presets + custom) */
  getAllStatuses(): Array<IStatusPreset | ICustomStatus> {
    return [...this.getActivePresets(), ...this.getCustomStatuses()];
  }

  /** Get a status by canonical ID */
  getStatusById(id: string): IStatusPreset | ICustomStatus | null {
    // Check presets
    const preset = STATUS_PRESETS.find(p => p.id === id);
    if (preset && !this.config.disabledPresets.includes(id)) {
      const override = this.config.presetOverrides[id];
      return override ? { ...preset, ...override } : preset;
    }
    // Check custom
    return this.config.custom[id] || null;
  }

  /** Get mood presets (with overrides) */
  getActiveMoods(): IMoodPreset[] {
    return MOOD_PRESETS.map(m => {
      const override = this.moodConfig.presetOverrides[m.id];
      return override ? { ...m, ...override } : m;
    });
  }

  /** Get mood by canonical ID */
  getMoodById(id: string): IMoodPreset | null {
    const mood = MOOD_PRESETS.find(m => m.id === id);
    if (!mood) return null;
    const override = this.moodConfig.presetOverrides[id];
    return override ? { ...mood, ...override } : mood;
  }

  /** Get user aliases for AliasResolver */
  getUserAliases(): Record<string, string> {
    return this.config.userAliases;
  }

  getUserMoodAliases(): Record<string, string> {
    return this.moodConfig.userAliases;
  }

  /** Add a custom status */
  addCustomStatus(status: ICustomStatus): void {
    this.config.custom[status.id] = status;
    // Auto-register aliases
    for (const alias of status.aliases) {
      this.config.userAliases[alias.toLowerCase()] = status.id;
    }
  }

  /** Remove a custom status */
  removeCustomStatus(id: string): void {
    const status = this.config.custom[id];
    if (status) {
      for (const alias of status.aliases) {
        delete this.config.userAliases[alias.toLowerCase()];
      }
    }
    delete this.config.custom[id];
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
