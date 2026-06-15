import type { Moment } from "moment";
import { Notice } from "obsidian";
import type { TFile } from "obsidian";
import {
  getDailyNoteSettings,
  getTemplateInfo,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

import { getDatedNotePathAndEnsureFolder } from "./notePaths";

async function createDailyNoteInDatedFolder(date: Moment): Promise<TFile> {
  const app = window.app;
  const { vault } = app;
  const moment = window.moment;
  const { template, format, folder } = getDailyNoteSettings();
  const [templateContents, IFoldInfo] = await getTemplateInfo(template);
  const filename = date.format(format);
  const normalizedPath = await getDatedNotePathAndEnsureFolder(
    folder,
    date,
    filename
  );

  try {
    const createdFile = await vault.create(
      normalizedPath,
      templateContents
        .replace(/{{\s*date\s*}}/gi, filename)
        .replace(/{{\s*time\s*}}/gi, moment().format("HH:mm"))
        .replace(/{{\s*title\s*}}/gi, filename)
        .replace(
          /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
          (_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
            const now = moment();
            const currentDate = date.clone().set({
              hour: now.get("hour"),
              minute: now.get("minute"),
              second: now.get("second"),
            });

            if (calc) {
              currentDate.add(parseInt(timeDelta, 10), unit);
            }

            if (momentFormat) {
              return currentDate.format(momentFormat.substring(1).trim());
            }

            return currentDate.format(format);
          }
        )
        .replace(
          /{{\s*yesterday\s*}}/gi,
          date.clone().subtract(1, "day").format(format)
        )
        .replace(
          /{{\s*tomorrow\s*}}/gi,
          date.clone().add(1, "d").format(format)
        )
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<any>app).foldManager.save(createdFile, IFoldInfo);

    return createdFile;
  } catch (err) {
    console.error(`Failed to create file: '${normalizedPath}'`, err);
    new Notice("Unable to create new file.");
  }
}

/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreateDailyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace } = window.app;
  const { format } = getDailyNoteSettings();
  const filename = date.format(format);

  const createFile = async () => {
    const dailyNote = await createDailyNoteInDatedFolder(date);
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();

    await leaf.openFile(dailyNote, { active: true });
    cb?.(dailyNote);
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
