import type { App, AbstractFile } from "./obsidian";

type TemplateContext = object;

interface IParams {
  dir?: string;
  filename: string;
  templateContents: string;
  ctx: TemplateContext;
}

export async function createFileFromTemplate({
  dir = "",
  filename,
  templateContents,
  ctx,
}: IParams): Promise<AbstractFile> {
  const app = (<any>window).app as App;
  const createdFile = await app.fileManager.createNewMarkdownFile(
    dir,
    filename
  );

  let template = templateContents;
  Object.entries(ctx).forEach(([ctxKey, ctxValue]) => {
    const regexKey = `\\{\\{\\s*${ctxKey}\\s*\\}\\}`;
    template = template.replace(new RegExp(regexKey, "i"), ctxValue);
  });

  await app.vault.modify(createdFile, template);

  return createdFile;
}
