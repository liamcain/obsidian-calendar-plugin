import type { Leaf, View } from "./obsidian";

export default class BaseViewType {
  leaf: Leaf;
  view: View;
  hasLoaded: boolean = false;

  constructor(view: View) {
    this.view = view;
    this.load = this.load.bind(this);
    this.update = this.update.bind(this);

    this.hasLoaded = false;
  }

  getViewType(): string {
    return "not implemented";
  }

  load() {
    this.hasLoaded = true;
  }

  getDisplayText(): string {
    return "Plugin";
  }

  getIcon(): string {
    return "document";
  }

  getState() {}
  setState() {}
  onResize() {}
  onOpen() {}
  toggle() {}
  close() {}

  open(leaf: Leaf) {
    this.leaf = leaf;
    this.update();
  }

  update() {
    if (!this.hasLoaded) {
      this.load();
    }
  }
}
