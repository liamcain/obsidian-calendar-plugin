import { App, Notice, TFile } from "obsidian";

import { DEFAULT_DATE_FORMAT } from "./constants";
import { normalize, normalizedJoin } from "./path";
import {
  getDailyNoteTemplatePath,
  getDateFormat,
  getNoteFolder,
  IDailyNoteSettings,
  ISettings,
} from "./settings";

export interface IMoment {
  add: (value: number, prop: string) => IMoment;
  clone: () => IMoment;
  date: (date: number) => IMoment;
  daysInMonth: () => number;
  format: (format: string) => string;
  isoWeekday: () => number;
  subtract: (value: number, prop: string) => IMoment;
}

function getDailyNoteTemplateContents(settings: ISettings): Promise<string> {
  const app = (<any>window).app as App;
  const { vault } = app;

  let templatePath = getDailyNoteTemplatePath(settings);
  if (!templatePath) {
    return Promise.resolve("");
  }

  if (!templatePath.endsWith(".md")) {
    templatePath += ".md";
  }

  try {
    const templateFile = vault.getAbstractFileByPath(
      normalize(templatePath)
    ) as TFile;
    return vault.cachedRead(templateFile);
  } catch (err) {
    console.error(`Failed to read daily note template '${templatePath}'`, err);
    new Notice("Failed to read the daily note template");
    return Promise.resolve("");
  }
}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createDailyNote(
  date: IMoment,
  settings: ISettings
): Promise<TFile> {
  const app = (<any>window).app as App;
  const moment = (<any>window).moment;
  const { vault } = app;

  const folder = getNoteFolder(settings);
  const format = getDateFormat(settings);
  const templateContents = await getDailyNoteTemplateContents(settings);

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
