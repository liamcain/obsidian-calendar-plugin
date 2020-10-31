import moment from "moment";
import { App, Notice, TFile } from "obsidian";
import * as path from "path";

export function normalizedJoin(directory: string, filename: string) {
  return path.normalize(path.join(directory, filename));
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

  try {
    return app.vault.create(
      normalizedPath,
      templateContents.replace(
        /{{(date|time):(.*?)}}/gi,
        (match, groups, n) => {
          return moment(filename).format(n);
        }
      )
    );
  } catch (err) {
    console.error(`Failed to create file: '${normalizedPath}'`, err);
    new Notice("Unable to create new file.");
  }
}
