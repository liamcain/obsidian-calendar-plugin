import semverGte from "semver/functions/gte";
import semverLt from "semver/functions/lt";

import type { ISettings } from "src/settings";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type IAnySettings = any;

interface IMigration {
  version: string;
  apply: (settings: IAnySettings) => void;
}

const migrations: IMigration[] = [];

export default function applyMigrations(settings: IAnySettings): ISettings {
  const previousVersion: string = settings.version || "1.0.0";
  const currentVersion: string = process.env.PLUGIN_VERSION;

  for (const migration of migrations) {
    if (
      semverLt(previousVersion, migration.version) &&
      semverGte(currentVersion, migration.version)
    ) {
      migration.apply(settings);
    }
  }
  return settings;
}
