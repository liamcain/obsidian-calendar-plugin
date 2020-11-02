import { App, Notice, TFile } from "obsidian";

import { DEFAULT_DATE_FORMAT } from "./constants";
import { normalize, normalizedJoin } from "./path";
import type { IDailyNoteSettings } from "./settings";

export interface IMoment {
  format: (format: string) => string;
}

function getDailyNoteTemplateContents(
  dailyNoteSettings: IDailyNoteSettings
): Promise<string> {
  const app = (<any>window).app as App;
  const { vault } = app;

  let templatePath = dailyNoteSettings.template || "";
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
  dailyNoteSettings: IDailyNoteSettings
): Promise<TFile> {
  const app = (<any>window).app as App;
  const moment = (<any>window).moment;
  const { vault } = app;

  const { folder = "" } = dailyNoteSettings;
  const format = dailyNoteSettings.format || DEFAULT_DATE_FORMAT;

  const templateContents = await getDailyNoteTemplateContents(
    dailyNoteSettings
  );

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
