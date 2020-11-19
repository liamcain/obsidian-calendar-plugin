import type { Moment } from "moment";
import { Notice, TFile } from "obsidian";

import { getNotePath } from "src/io/path";
import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

import { getTemplateContents } from "./dailyNotes";

export async function createWeeklyNote(
  date: Moment,
  settings: ISettings
): Promise<TFile> {
  const { vault } = window.app;
  const templateContents = await getTemplateContents(
    settings.weeklyNoteTemplate
  );
  const filename = date.format(settings.weeklyNoteFormat);
  const normalizedPath = getNotePath(settings.weeklyNoteFolder, filename);

  try {
    return vault.create(
      normalizedPath,
      templateContents
        .replace(
          /{{\s*(date|time)\s*:(.*?)}}/gi,
          (_, timeOrDate, momentFormat) => {
            return date.format(momentFormat.trim());
          }
        )
        .replace(/{{\s*date\s*}}/gi, filename)
        .replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"))
        .replace(/{{\s*title\s*}}/gi, filename)
    );
  } catch (err) {
    console.error(`Failed to create file: '${normalizedPath}'`, err);
    new Notice("Unable to create new file.");
  }
}

/**
 * Create a Weekly Note for a given date.
 */
export async function tryToCreateWeeklyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: () => void
): Promise<void> {
  const { workspace } = window.app;
  const filename = date.format(settings.weeklyNoteFormat);

  const createFile = async () => {
    const dailyNote = await createWeeklyNote(date, settings);
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();

    await leaf.openFile(dailyNote);
    cb?.();
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  } else {
    await createFile();
  }
}
