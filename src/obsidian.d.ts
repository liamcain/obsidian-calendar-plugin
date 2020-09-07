export interface AbstractFile {
  stat: any;
}
export type Leaf = any;
export type View = any;

export class PluginInstance<TData = {}> {
  loadData<TData>(): Promise<TData>;
  saveData<TData>(value: TData);

  registerSettingTab(settingsTab: ISettingsTab);
}

export class Workspace {}

export class FileManager {
  createNewMarkdownFile: (
    dir: string,
    filename: string
  ) => Promise<AbstractFile>;
}

export class Vault {
  public adapter: Adapter;
  public modify: (absFile: AbstractFile, contents: string) => Promise<boolean>;
  public getAbstractFileByPath: (path: string) => AbstractFile;
}

export class Adapter {
  public fs: Fs;
  public path: Path;
  public basePath: string;
}

export class App {
  public fileManager: FileManager;
  public workspace: Workspace;
  public vault: Vault;
}
