import moment from "moment";
import * as path from "path";
import type { App, TFile } from "obsidian";

export async function createFileFromTemplate(
  normalizedPath: string,
  templateContents: string = "",
  ctx: any = {}
): Promise<TFile> {
  const app = (<any>window).app as App;

  let template = templateContents;
  Object.entries(ctx).forEach(([ctxKey, ctxValue]) => {
    const regexKey = `\\{\\{\\s*${ctxKey}\\s*\\}\\}`;
    template = template.replace(new RegExp(regexKey, "i"), ctxValue);
  });

  return app.vault.create(normalizedPath, template);
}

export async function createDailyNote(
  directory: string,
  filename: string,
  templateContents: string = ""
): Promise<TFile> {
  const normalizedPath = path.join(directory, `${filename}.md`);

  return createFileFromTemplate(
    normalizedPath,
    templateContents.replace(/{{(date|time):(.*?)}}/gi, (match, groups, n) => {
      return moment(filename).format(n);
    })
  );
}
