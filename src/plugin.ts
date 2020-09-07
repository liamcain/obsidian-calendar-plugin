import BasePlugin from "./BasePlugin";
import { VIEW_TYPE_CALENDAR } from "./constants";
import type { App, Leaf, View } from "./obsidian";
import CalendarViewType from "./viewType";

export default class CalendarPlugin extends BasePlugin {
  constructor() {
    super();

    this.id = "calendar-view";
    this.name = "Calendar View";
    this.description = "Show an interactive calendar view of your daily notes";
    this.defaultOn = true;
    this.defaultViewTypes = [VIEW_TYPE_CALENDAR];
  }

  init(app: App, instance: any) {
    super.init(app, instance);

    this.instance.registerViewType(
      VIEW_TYPE_CALENDAR,
      (view: View) => new CalendarViewType(view)
    );

    this.instance.registerEvent(
      this.app.workspace.on("file-open", this.refreshLeaves.bind(this))
    );
  }

  refreshLeaves() {
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_CALENDAR)
      .forEach((leaf: Leaf) => leaf.view.update());
  }
}
