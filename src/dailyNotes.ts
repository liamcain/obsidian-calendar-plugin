import { normalizePath, App, Notice, TFile } from "obsidian";
import type { IMoment } from "./moment";

import { getNotePath } from "./path";
import type { ISettings } from "./settings";
import { modal } from "./ui";

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

export interface IDailyNoteSettings {
  folder?: string;
  format?: string;
  template?: string;
}

/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getDailyNoteSettings(): IDailyNoteSettings {
  try {
    // XXX: Access private API for internal plugins
    const app = (window as any).app;
    const settings =
      app.internalPlugins.plugins["daily-notes"].instance.options;
    return {
      format: settings.format || DEFAULT_DATE_FORMAT,
      folder: settings.folder?.trim() || "",
      template: settings.template?.trim() || "",
    };
  } catch (err) {
    console.info("No custom daily note settings found!", err);
  }
}

export function appHasDailyNotesPluginLoaded(app: App) {
  const dailyNotesPlugin = (app as any).internalPlugins.plugins["daily-notes"];
  return dailyNotesPlugin && dailyNotesPlugin.enabled;
}

async function getTemplateContents(template: string): Promise<string> {
  const app = (<any>window).app as App;
  const { vault } = app;

  let templatePath = normalizePath(template);
  if (templatePath === "/") {
    return Promise.resolve("");
  }

  if (!templatePath.endsWith(".md")) {
    templatePath += ".md";
  }

  try {
    const templateFile = vault.getAbstractFileByPath(templatePath) as TFile;
    const contents = await vault.cachedRead(templateFile);
    return contents;
  } catch (err) {
    console.error(`Failed to read daily note template '${templatePath}'`, err);
    new Notice("Failed to read the daily note template");
    return "";
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
  settings?: IDailyNoteSettings
): Promise<TFile> {
  const app = (<any>window).app as App;
  const { vault } = app;
  const moment = (<any>window).moment;

  const dailyNoteSettings = settings || getDailyNoteSettings();
  const { template, format, folder } = dailyNoteSettings;

  const templateContents = await getTemplateContents(template);
  const filename = date.format(format);
  const normalizedPath = getNotePath(folder, filename);

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

/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreateDailyNote(
  date: IMoment,
  inNewSplit: boolean,
  dailyNoteSettings: IDailyNoteSettings,
  settings: ISettings,
  cb?: () => void
) {
  const app = (<any>window).app as App;

  const filename = date.format(dailyNoteSettings.format);

  const createFile = async () => {
    const dailyNote = await createDailyNote(date, dailyNoteSettings);
    const leaf = inNewSplit
      ? app.workspace.splitActiveLeaf()
      : app.workspace.getUnpinnedLeaf();

    await leaf.openFile(dailyNote);
    cb?.();
  };

  if (settings.shouldConfirmBeforeCreate) {
    modal.createConfirmationDialog(app, {
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  } else {
    await createFile();
  }
}
