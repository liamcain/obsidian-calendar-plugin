import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { createDailyNote } from "obsidian-daily-notes-interface";


/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreateDailyNote(
  date: Moment,
  inNewSplit: boolean,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace } = window.app;

  const createFile = async () => {
    const dailyNote = await createDailyNote(date);
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();

    await leaf.openFile(dailyNote, { active : true });
    cb?.(dailyNote);
  };

  await createFile();
}
