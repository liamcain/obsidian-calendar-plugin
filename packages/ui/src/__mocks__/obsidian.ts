export class TAbstractFile {}

export class TFile extends TAbstractFile {
  public basename: string;
  public path: string;
}

export class TFolder extends TAbstractFile {
  public children: TAbstractFile[];
  public path: string;
}

export class PluginSettingTab {}
export class Modal {}
export class Notice {}
export function normalizePath(notePath: string): string {
  if (!notePath.startsWith("/")) {
    return `/${notePath}`;
  }
  return notePath;
}
export class Vault {
  static recurseChildren(folder: TFolder, cb: (file: TFile) => void): void {
    folder.children.forEach((file) => {
      if (file instanceof TFile) {
        cb(file);
      } else if (file instanceof TFolder) {
        Vault.recurseChildren(file, cb);
      }
    });
  }
}
