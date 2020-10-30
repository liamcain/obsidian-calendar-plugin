import { Plugin, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "./constants";
import CalendarView from "./view";

export default class CalendarPlugin extends Plugin {
  onload() {
    this.registerView(
      VIEW_TYPE_CALENDAR,
      // @ts-ignore
      (leaf: WorkspaceLeaf) => new CalendarView(leaf)
    );

    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.registerEvent(
        this.app.workspace.on("layout-ready", this.initLeaf.bind(this))
      );
    }
  }

  initLeaf() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }
}
