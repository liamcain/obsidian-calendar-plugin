import { normalizePath } from "obsidian";
import { join } from "path";

export function getNotePath(directory: string, filename: string): string {
  if (!filename.endsWith(".md")) {
    filename += ".md";
  }
  return normalizePath(join(directory, filename));
}
