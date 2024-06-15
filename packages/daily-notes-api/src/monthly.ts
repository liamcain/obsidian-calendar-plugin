import type { Moment } from "moment";
import { normalizePath, Notice, TFile, TFolder, Vault } from "obsidian";

import { getDateFromFile, getDateUID } from "./parse";
import { getMonthlyNoteSettings } from "./settings";
import { getNotePath, getTemplateInfo } from "./vault";

export class MonthlyNotesFolderMissingError extends Error {}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createMonthlyNote(date: Moment): Promise<TFile> {
  const { vault } = window.app;
  const { template, format, folder } = getMonthlyNoteSettings();
  const [templateContents, IFoldInfo] = await getTemplateInfo(template);
  const filename = date.format(format);
  const normalizedPath = await getNotePath(folder, filename);

  try {
    const createdFile = await vault.create(
      normalizedPath,
      templateContents
        .replace(
          /{{\s*(date|time)\s*:(.*?)}}/gi,
          (_, _timeOrDate, momentFormat) => {
            const now = window.moment();
            return date
              .set({
                hour: now.get("hour"),
                minute: now.get("minute"),
                second: now.get("second"),
              })
              .format(momentFormat.trim());
          }
        )
        .replace(/{{\s*date\s*}}/gi, filename)
        .replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"))
        .replace(/{{\s*title\s*}}/gi, filename)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.app as any).foldManager.save(createdFile, IFoldInfo);

    return createdFile;
  } catch (err) {
    console.error(`Failed to create file: '${normalizedPath}'`, err);
    new Notice("Unable to create new file.");
  }
}

export function getMonthlyNote(
  date: Moment,
  monthlyNotes: Record<string, TFile>
): TFile {
  return monthlyNotes[getDateUID(date, "month")] ?? null;
}

export function getAllMonthlyNotes(): Record<string, TFile> {
  const { vault } = window.app;
  const { folder } = getMonthlyNoteSettings();

  const monthlyNotesFolder = vault.getAbstractFileByPath(
    normalizePath(folder)
  ) as TFolder;

  if (!monthlyNotesFolder) {
    throw new MonthlyNotesFolderMissingError(
      "Failed to find monthly notes folder"
    );
  }

  const monthlyNotes: Record<string, TFile> = {};
  Vault.recurseChildren(monthlyNotesFolder, (note) => {
    if (note instanceof TFile) {
      const date = getDateFromFile(note, "month");
      if (date) {
        const dateString = getDateUID(date, "month");
        monthlyNotes[dateString] = note;
      }
    }
  });

  return monthlyNotes;
}
