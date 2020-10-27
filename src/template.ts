import type { App, TFile } from "obsidian";

type TemplateContext = object;

interface IParams {
  dir?: string;
  filename: string;
  templateContents: string;
  ctx?: TemplateContext;
}

export async function createFileFromTemplate({
  dir = "",
  filename,
  templateContents,
  ctx = {},
}: IParams): Promise<TFile> {
  const app = (<any>window).app as App;
  const createdFile = await app.vault.create(dir, filename);

  let template = templateContents;
  Object.entries(ctx).forEach(([ctxKey, ctxValue]) => {
    const regexKey = `\\{\\{\\s*${ctxKey}\\s*\\}\\}`;
    template = template.replace(new RegExp(regexKey, "i"), ctxValue);
  });

  await app.vault.modify(createdFile, template);

  return createdFile;
}
