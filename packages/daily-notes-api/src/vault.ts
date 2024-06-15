import { normalizePath, Notice } from "obsidian";

interface IFold {
  from: number;
  to: number;
}

interface IFoldInfo {
  folds: IFold[];
}

// Credit: @creationix/path.js
export function join(...partSegments: string[]): string {
  // Split the inputs into a list of path commands.
  let parts = [];
  for (let i = 0, l = partSegments.length; i < l; i++) {
    parts = parts.concat(partSegments[i].split("/"));
  }
  // Interpret the path commands to get the new resolved path.
  const newParts = [];
  for (let i = 0, l = parts.length; i < l; i++) {
    const part = parts[i];
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part || part === ".") continue;
    // Push new path segments.
    else newParts.push(part);
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === "") newParts.unshift("");
  // Turn back into a single string path.
  return newParts.join("/");
}

async function ensureFolderExists(path: string): Promise<void> {
  const dirs = path.replace(/\\/g, "/").split("/");
  dirs.pop(); // remove basename

  if (dirs.length) {
    const dir = join(...dirs);
    if (!window.app.vault.getAbstractFileByPath(dir)) {
      await window.app.vault.createFolder(dir);
    }
  }
}

export async function getNotePath(
  directory: string,
  filename: string
): Promise<string> {
  if (!filename.endsWith(".md")) {
    filename += ".md";
  }
  const path = normalizePath(join(directory, filename));

  await ensureFolderExists(path);

  return path;
}

export async function getTemplateInfo(
  template: string
): Promise<[string, IFoldInfo]> {
  const { metadataCache, vault } = window.app;

  const templatePath = normalizePath(template);
  if (templatePath === "/") {
    return Promise.resolve(["", null]);
  }

  try {
    const templateFile = metadataCache.getFirstLinkpathDest(templatePath, "");
    const contents = await vault.cachedRead(templateFile);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IFoldInfo = (window.app as any).foldManager.load(templateFile);
    return [contents, IFoldInfo];
  } catch (err) {
    console.error(
      `Failed to read the daily note template '${templatePath}'`,
      err
    );
    new Notice("Failed to read the daily note template");
    return ["", null];
  }
}
