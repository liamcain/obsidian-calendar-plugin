import { App, Notice, TFile } from "obsidian";
import { join } from "path";

export function normalize(path: string) {
  // Always use forward slash
  path = path.replace(/\\/g, "/");

  // Strip start/end slash
  while (path.startsWith("/") && path !== "/") {
    path = path.substr(1);
  }
  while (path.endsWith("/") && path !== "/") {
    path = path.substr(0, path.length - 1);
  }

  // Use / for root
  if (path === "") {
    path = "/";
  }

  path = path
    // Replace non-breaking spaces with regular spaces
    .replace("\u00A0", " ")
    // Normalize unicode to NFC form
    .normalize("NFC");

  return path;
}

export function normalizedJoin(directory: string, filename: string) {
  return normalize(join(directory, filename));
}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}} and {{time}} with the formatted
 * timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createDailyNote(
  directory: string,
  filename: string,
  templateContents: string = ""
): Promise<TFile> {
  const app = (<any>window).app as App;
  const normalizedPath = normalizedJoin(directory, `${filename}.md`);
  const moment = (<any>window).moment;

  try {
    return app.vault.create(
      normalizedPath,
      templateContents
        .replace(/{{(date|time):(.*?)}}/gi, (_, timeOrDate, momentFormat) => {
          return moment(filename).format(momentFormat);
        })
        .replace(/{{date}}/gi, moment(filename).format("YYYY-MM-DD"))
        .replace(/{{time}}/gi, moment().format("HH:mm"))
        .replace(/{{title}}/gi, filename)
    );
  } catch (err) {
    console.error(`Failed to create file: '${normalizedPath}'`, err);
    new Notice("Unable to create new file.");
  }
}
