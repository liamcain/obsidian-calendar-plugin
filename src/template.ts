import moment from "moment";
import type { App, TFile } from "obsidian";
import * as path from "path";

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
  const normalizedPath = path.join(directory, `${filename}.md`);

  return app.vault.create(
    normalizedPath,
    templateContents.replace(/{{(date|time):(.*?)}}/gi, (match, groups, n) => {
      return moment(filename).format(n);
    })
  );
}
