import type { Moment } from "moment";
import { Notice, TFile } from "obsidian";

import { getNotePath } from "src/io/path";
import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

import { getDailyNoteSettings, getTemplateContents } from "./dailyNotes";

function getWeekEmbed(date: Moment, settings: ISettings): string {
  const { format } = getDailyNoteSettings();
  const embeds = [];
  for (let i = 0; i < 7; i++) {
    const weekday = date.clone().weekday(i);
    embeds.push(`![[${weekday.format(format)}]]`);
  }

  if (settings.shouldStartWeekOnMonday) {
    const sunday = embeds.pop();
    embeds.push(sunday);
  }

  return embeds.join("\n");
}

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
        .replace(/{{\s*title\s*}}/gi, filename)
        .replace(/{{\s*week-embeds\s*}}/gi, getWeekEmbed(date, settings))
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
