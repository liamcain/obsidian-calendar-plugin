import { Moment } from "moment";
import "obsidian";
import { Granularity, ILocaleOverride, IWeekStartOption } from "obsidian-calendar-ui";

declare module "obsidian" {
  interface IWeeklyNoteOptions {
    weeklyNoteFormat: string;
    weeklyNoteFolder: string;
    weeklyNoteTemplate: string;
  }

  export class CalendarPlugin extends Plugin {
    options: IWeeklyNoteOptions;
  }

  export interface Workspace extends Events {
    on(
      name: "periodic-notes:settings-updated",
      callback: () => void,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      ctx?: any
    ): EventRef;
    on(
      name: "periodic-notes:resolve",
      callback: () => void,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      ctx?: any
    ): EventRef;
    on(
      name: "periodic-notes:file-modified",
      callback: () => void,
      granularity: Granularity,
      file: TFile,
      metadata: PeriodicNoteCachedMetadata
    ): EventRef;

    ensureSideLeaf(
      viewType: string,
      side: "left" | "right",
      split: boolean,
      before?: boolean,
      viewState?: ViewState
    ): void;
  }

  interface CommandManager {
    removeCommand(commandName: string): void;
  }

  interface MarkdownView {
    onMarkdownFold(): void;
  }

  interface MarkdownSubView {
    applyFoldInfo(foldInfo: FoldInfo): void;
    getFoldInfo(): FoldInfo | null;
  }

  interface Editor {
    cm: CodeMirror.Editor;
  }

  interface EditorSuggestManager {
    suggests: EditorSuggest<unknown>[];
  }

  interface VaultSettings {
    legacyEditor: boolean;
    foldHeading: boolean;
    foldIndent: boolean;
    rightToLeft: boolean;
    readableLineLength: boolean;
    tabSize: number;
    showFrontmatter: boolean;

    // XXX: Added from Periodic Notes
    localeOverride: ILocaleOverride;
    weekStart: IWeekStartOption;
  }

  interface FoldPosition {
    from: number;
    to: number;
  }

  interface FoldInfo {
    folds: FoldPosition[];
    lines: number;
  }

  export interface FoldManager {
    load(file: TFile): Promise<FoldInfo>;
    save(file: TFile, foldInfo: FoldInfo): Promise<void>;
  }

  interface Chooser<T> {
    useSelectedItem(evt: KeyboardEvent): void;
    setSuggestions(suggestions: T[]): void;
  }

  interface Vault {
    config: Record<string, unknown>;
    getConfig<T extends keyof VaultSettings>(setting: T): VaultSettings[T];
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    setConfig<T extends keyof VaultSettings>(setting: T, value: any): void;
  }

  export interface PluginInstance {
    id: string;
  }

  export interface DailyNotesSettings {
    autorun?: boolean;
    format?: string;
    folder?: string;
    template?: string;
  }

  class DailyNotesPlugin implements PluginInstance {
    id: string;
    options?: DailyNotesSettings;
  }

  export interface ViewRegistry {
    viewByType: Record<string, (leaf: WorkspaceLeaf) => unknown>;
    isExtensionRegistered(extension: string): boolean;
  }

  export interface App {
    commands: CommandManager;
    foldManager: FoldManager;
    internalPlugins: InternalPlugins;
    plugins: CommunityPluginManager;
    viewRegistry: ViewRegistry;
  }

  type MatchType = "filename" | "frontmatter" | "date-prefixed";
  type PluginId = "nldates-obsidian" | "calendar" | string;

  export interface PeriodicNoteMatchMatchData {
    matchType: MatchType;
    exact: boolean;
  }

  export interface PeriodicNoteCachedMetadata {
    calendarSet: string;
    filePath: string;
    date: Moment;
    granularity: Granularity;
    canonicalDateStr: string;

    /* "how" the match was made */
    matchData: PeriodicNoteMatchMatchData;
  }

  interface IOpenOpts {
    inNewSplit?: boolean;
    calendarSet?: string;
  }

  export class PeriodicNotesPlugin extends Plugin {
    public isWeeklyFormatISO8601(): boolean;
    public createPeriodicNote(granularity: Granularity, date: Moment): Promise<TFile>;
    public getPeriodicNote(granularity: Granularity, date: Moment): TFile | null;
    public getPeriodicNotes(
      granularity: Granularity,
      date: Moment,
      includeFinerGranularities: boolean
    ): PeriodicNoteCachedMetadata[];
    public isPeriodic(filePath: string, granularity?: Granularity): boolean;
    public findAdjacent(
      calendarSet: string,
      filePath: string,
      direction: "forwards" | "backwards"
    ): PeriodicNoteCachedMetadata | null;
    public findInCache(filePath: string): PeriodicNoteCachedMetadata | null;
    public openPeriodicNote(
      granularity: Granularity,
      date: Moment,
      opts?: IOpenOpts
    ): Promise<void>;
    public showRelatedNotes(granularity: Granularity, date: Moment): void;
  }

  export interface CommunityPluginManager {
    getPlugin(id: "periodic-notes"): PeriodicNotesPlugin;
    getPlugin(id: PluginId): Plugin;
  }

  export interface InstalledPlugin {
    disable: (onUserDisable: boolean) => void;
    enabled: boolean;
    instance: PluginInstance;
  }

  export interface InternalPlugins {
    plugins: Record<string, InstalledPlugin>;
    getPluginById(id: string): InstalledPlugin;
  }

  interface NLDResult {
    formattedString: string;
    date: Date;
    moment: Moment;
  }

  interface NLDatesPlugin extends Plugin {
    parseDate(dateStr: string): NLDResult;
  }
}
