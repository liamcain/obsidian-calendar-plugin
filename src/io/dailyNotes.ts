import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  createPeriodicNote,
  getPeriodicNoteSettings,
  IGranularity,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

function getPeriodicity(granularity: IGranularity): string {
  const periodicity = {
    day: "daily",
    week: "weekly",
    month: "monthly",
  };
  return periodicity[granularity];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreatePeriodicNote(
  granularity: IGranularity,
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace } = window.app;
  const { format } = getPeriodicNoteSettings(granularity);
  const filename = date.format(format);

  const createFile = async () => {
    const periodicNote = await createPeriodicNote(granularity, date);
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();

    await leaf.openFile(periodicNote);
    cb?.(periodicNote);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: `New ${capitalize(getPeriodicity(granularity))} Note`,
    });
  } else {
    await createFile();
  }
}
