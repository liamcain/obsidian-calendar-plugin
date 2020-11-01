import { App, Notice, TFile } from "obsidian";

import { DEFAULT_DATE_FORMAT } from "./constants";
import { normalize, normalizedJoin } from "./path";

export interface IDailyNoteSettings {
  folder?: string;
  format?: string;
  template?: string;
}

export interface IMoment {
  format: (format: string) => string;
}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}} and {{time}} with the formatted
 * timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createDailyNote(
  date: IMoment,
  dailyNoteSettings: IDailyNoteSettings
): Promise<TFile> {
  const app = (<any>window).app as App;
  const moment = (<any>window).moment;
  const { vault } = app;

  const { template = "", folder = "" } = dailyNoteSettings;
  const format = dailyNoteSettings.format || DEFAULT_DATE_FORMAT;

  let templateContents = "";
  if (template) {
    try {
      const templateFile = vault.getAbstractFileByPath(
        normalize(template)
      ) as TFile;
      templateContents = await vault.cachedRead(templateFile);
    } catch (err) {
      console.error("Failed to read daily note template", err);
      new Notice("Failed to read the daily note template");
      return;
    }
  }

  const filename = date.format(format);
  const normalizedPath = normalizedJoin(folder, `${filename}.md`);

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
        .replace(/{{\s*time\s*}}/gi, moment().format("HH:mm"))
        .replace(/{{\s*title\s*}}/gi, filename)
    );
  } catch (err) {
    console.error(`Failed to create file: '${normalizedPath}'`, err);
    new Notice("Unable to create new file.");
  }
}
