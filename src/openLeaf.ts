import type { WorkspaceLeaf } from "obsidian";

export default function openLeaf(inNewTab: boolean): WorkspaceLeaf {
  return inNewTab
    ? // @ts-expect-error: we're on an old version of obsidian types, for now this will cause error
      window.app.workspace.createLeafInTabGroup()
    : window.app.workspace.getUnpinnedLeaf();
}
