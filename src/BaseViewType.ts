import type { Leaf, View } from "./obsidian";

export default class BaseViewType {
  leaf: Leaf;
  view: View;

  constructor(view: View) {
    this.view = view;
    this.update = this.update.bind(this);
  }

  getViewType(): string {
    return "not implemented";
  }

  load() {
    this.update();
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

  update() {}
}
