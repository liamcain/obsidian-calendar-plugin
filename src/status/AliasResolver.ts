/**
 * AliasResolver — resolves user-written tags/labels to canonical status IDs.
 * Supports preset aliases, user-defined aliases, and fuzzy matching.
 */

import { STATUS_PRESETS, MOOD_PRESETS, type IStatusPreset, type IMoodPreset } from "./presets";

export interface IAliasEntry {
  alias: string;   // e.g. "请假"
  canonicalId: string; // e.g. "leave"
}

export interface IAliasConfig {
  // Built-in aliases (from presets, regenerated on load)
  presetAliases: Record<string, string>;
  // User-defined aliases (from settings)
  userAliases: Record<string, string>;
}

export class AliasResolver {
  private aliasMap: Map<string, string> = new Map();
  private moodAliasMap: Map<string, string> = new Map();

  /**
   * Build alias map from presets + user-defined aliases.
   * All keys are lowercased for case-insensitive matching.
   */
  constructor(userAliases?: Record<string, string>, userMoodAliases?: Record<string, string>) {
    // Status aliases from presets
    for (const preset of STATUS_PRESETS) {
      for (const alias of preset.aliases) {
        this.aliasMap.set(alias.toLowerCase(), preset.id);
      }
      // Also map the canonical id itself
      this.aliasMap.set(preset.id.toLowerCase(), preset.id);
    }

    // Mood aliases from presets
    for (const mood of MOOD_PRESETS) {
      for (const alias of mood.aliases) {
        this.moodAliasMap.set(alias.toLowerCase(), mood.id);
      }
      this.moodAliasMap.set(mood.id.toLowerCase(), mood.id);
    }

    // User-defined status aliases (override presets)
    if (userAliases) {
      for (const [alias, id] of Object.entries(userAliases)) {
        this.aliasMap.set(alias.toLowerCase(), id);
      }
    }

    // User-defined mood aliases
    if (userMoodAliases) {
      for (const [alias, id] of Object.entries(userMoodAliases)) {
        this.moodAliasMap.set(alias.toLowerCase(), id);
      }
    }
  }

  /** Resolve a status tag to its canonical ID */
  resolveStatus(tag: string): string | null {
    const key = tag.trim().toLowerCase();
    if (this.aliasMap.has(key)) return this.aliasMap.get(key)!;
    // Fuzzy match only for ASCII tags of length >= 4 (e.g. "leving" → "leave")
    // Chinese 2-char tags have max edit distance 2 between any pair, making fuzzy matching meaningless
    if (/^[a-z0-9]+$/.test(key) && key.length >= 4) {
      return this.fuzzyMatch(this.aliasMap, key, 1);
    }
    return null;
  }

  /** Resolve a mood tag to its canonical ID */
  resolveMood(tag: string): string | null {
    const key = tag.trim().toLowerCase();
    if (this.moodAliasMap.has(key)) return this.moodAliasMap.get(key)!;
    if (/^[a-z0-9]+$/.test(key) && key.length >= 4) {
      return this.fuzzyMatch(this.moodAliasMap, key, 1);
    }
    return null;
  }

  /** Check if a tag is a known status alias */
  isStatusTag(tag: string): boolean {
    return this.resolveStatus(tag) !== null;
  }

  /** Get all known status aliases (for building alias tables) */
  getAllStatusAliases(): IAliasEntry[] {
    const entries: IAliasEntry[] = [];
    for (const [alias, id] of this.aliasMap) {
      entries.push({ alias, canonicalId: id });
    }
    return entries;
  }

  private fuzzyMatch(map: Map<string, string>, key: string, maxDistance: number): string | null {
    if (key.length < 4) return null;
    let bestMatch: string | null = null;
    let bestDistance = maxDistance + 1;
    for (const [alias, id] of map) {
      if (Math.abs(alias.length - key.length) > maxDistance) continue;
      const dist = this.editDistance(alias, key);
      if (dist <= maxDistance && dist < bestDistance) {
        bestDistance = dist;
        bestMatch = id;
      }
    }
    return bestMatch;
  }

  private editDistance(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array(n + 1).fill(0).map((_, j) => j);
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return dp[n];
  }
}
