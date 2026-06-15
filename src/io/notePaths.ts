import type { Moment } from "moment";
import { normalizePath, TFolder } from "obsidian";

/**
 * Normalize user-entered vault folders as paths relative to the vault root.
 */
export function normalizeVaultFolder(folder = ""): string {
  const normalized = normalizePath(folder.trim().replace(/\\/g, "/"));

  if (normalized === "/" || normalized === ".") {
    return "";
  }

  return normalized.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function getDatedNoteFolder(folder: string | undefined, date: Moment): string {
  return normalizeVaultFolder(
    [folder, date.format("YYYY"), date.format("MM")]
      .filter(Boolean)
      .join("/")
  );
}

export function getDatedNotePath(
  folder: string | undefined,
  date: Moment,
  filename: string
): string {
  const datedFolder = getDatedNoteFolder(folder, date);
  const noteFilename = filename.endsWith(".md") ? filename : `${filename}.md`;

  return normalizeVaultFolder([datedFolder, noteFilename].filter(Boolean).join("/"));
}

export async function ensureFolderExists(folderPath: string): Promise<void> {
  const { vault } = window.app;
  const normalizedFolder = normalizeVaultFolder(folderPath);

  if (!normalizedFolder) {
    return;
  }

  const parts = normalizedFolder.split("/").filter(Boolean);
  let currentPath = "";

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;

    const existing = vault.getAbstractFileByPath(currentPath);
    if (!existing) {
      await vault.createFolder(currentPath);
      continue;
    }

    if (!(existing instanceof TFolder)) {
      throw new Error(`Cannot create folder '${currentPath}': a file exists there`);
    }
  }
}

export async function getDatedNotePathAndEnsureFolder(
  folder: string | undefined,
  date: Moment,
  filename: string
): Promise<string> {
  const notePath = getDatedNotePath(folder, date, filename);
  const folderPath = notePath.split("/").slice(0, -1).join("/");

  await ensureFolderExists(folderPath);

  return notePath;
}
