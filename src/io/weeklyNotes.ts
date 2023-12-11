import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
  createWeeklyNote,
  getWeeklyNoteSettings,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

/**
 * Create a Weekly Note for a given date.
 */
export async function tryToCreateWeeklyNote(
  date: Moment,
  ctrlPressed: boolean,
  settings: ISettings,
  cb?: (file: TFile) => void
): Promise<void> {
  const { workspace } = window.app;
  const { format } = getWeeklyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const dailyNote = await createWeeklyNote(date);
    let leaf;
    if (ctrlPressed) {
      if (settings.ctrlClickOpensInNewTab) {
        leaf = workspace.getLeaf('tab');
      } else {
        leaf = workspace.splitActiveLeaf();
      }
    } else {
      leaf = workspace.getUnpinnedLeaf();
    }
    await leaf.openFile(dailyNote, { active : true });
    cb?.(dailyNote);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Weekly Note",
    });
  } else {
    await createFile();
  }
}
