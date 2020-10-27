import { Plugin, WorkspaceLeaf } from "obsidian";

import { VIEW_TYPE_CALENDAR } from "./constants";
import CalendarView from "./view";

export default class CalendarPlugin extends Plugin {
  onload() {
    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf: WorkspaceLeaf) => new CalendarView(leaf)
    );
  }

  onInit() {
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CALENDAR,
    });
  }
}
