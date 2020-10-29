import type { App, WorkspaceLeaf } from "obsidian";

// XXX: temporary until Obsidian v0.9.8 is released.
// Currently `obsidian.View` is not exported
export class View {
  app: App;
  containerEl: HTMLElement;
  leaf: WorkspaceLeaf;

  constructor(leaf: WorkspaceLeaf) {
    this.app = (leaf as any).app;
    this.leaf = leaf;
    this.containerEl = leaf.view.containerEl;
    // @ts-ignore
    this.leaf.view = this;
  }

  open() {
    this.containerEl.empty();
  }

  close() {}

  onOpen() {}
  getState() {}
  setState() {}
  onResize() {}
}
