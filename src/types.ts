import type { App, WorkspaceLeaf } from "obsidian";

// XXX: temporary until Obsidian v0.9.9 is released.
// Currently `obsidian.View` is not exported
export class View {
  app: App;
  containerEl: HTMLElement;
  leaf: WorkspaceLeaf;

  constructor(leaf: WorkspaceLeaf) {
    console.log("baseclass constructor called");
    this.app = (leaf as any).app;
    this.leaf = leaf;
    this.containerEl = leaf.view.containerEl;
    // @ts-ignore
    this.leaf.view = this;
  }

  open(containerEl: HTMLElement) {
    containerEl.empty();
    console.log("called open");
    this.onOpen();
  }

  close() {}

  onOpen() {}
  getState() {}
  setState() {}
  onResize() {}
}
