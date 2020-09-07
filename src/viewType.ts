import moment from "moment";

import type BasePlugin from "./BasePlugin";
import BaseViewType from "./BaseViewType";
import Calendar from "./Calendar.svelte";
import type { View } from "./obsidian";
import { createFileFromTemplate } from "./template";
import { modal } from "./ui";

import { VIEW_TYPE_CALENDAR } from "./constants";

export default class CalendarViewType extends BaseViewType {
  directory: string;
  format: string;
  volcanoPath: string;

  constructor(view: View) {
    super(view);

    this.directory = "";
    this.format = "YYYY-MM-DD";

    this._openFileByName = this._openFileByName.bind(this);
    this.update = this.update.bind(this);

    const dailyNotesPlugin = this.view.app.plugins
      .getEnabledPlugins()
      .find((p: BasePlugin) => p.instance.id === "daily-notes");

    if (dailyNotesPlugin) {
      dailyNotesPlugin.loadData().then((data) => {
        this.directory = data["folder"] || "";
        this.format = data["format"] || "YYYY-MM-DD";
      });
    }

    this._createDailyNote = this._createDailyNote.bind(this);
  }

  getViewType() {
    return VIEW_TYPE_CALENDAR;
  }

  load() {
    this.update();
  }

  getDisplayText() {
    return "Calendar";
  }

  getIcon() {
    return "calendar-with-checkmark";
  }

  getState() {}
  setState() {}
  onResize() {}
  onOpen() {}
  toggle() {}

  _openFileByName(filename: string) {
    let filenameWithExt = filename;
    if (!filenameWithExt.endsWith(".md")) {
      filenameWithExt += ".md";
    }

    const { vault, workspace } = this.view.app;
    const { path } = vault.adapter;
    const fileObj = vault.getAbstractFileByPath(
      path.join(this.directory, filenameWithExt)
    );

    if (!fileObj) {
      this.promptUserToCreateFile(filename);
      return;
    }
    workspace.activeLeaf.openFile(fileObj);
  }

  async _createDailyNote(filename: string) {
    const { vault, workspace } = this.view.app;

    const today = moment(filename);
    let temperature = "";
    let shortForecast = "";

    try {
      const dailyWeather = await fetch(
        "https://api.weather.gov/gridpoints/OKX/30,34/forecast"
      );
      const dailyWeatherJson = await dailyWeather.json();
      const currentWeather = dailyWeatherJson.properties.periods[0];
      temperature = currentWeather.temperature;
      shortForecast = currentWeather.shortForecast;
    } catch (err) {
      shortForecast = "???";
      temperature = "???";
    }

    const { basePath, fs } = vault.adapter;
    const templateContents = fs
      .readFileSync(`${basePath}/.obsidian/templates/daily_note.hbs`)
      .toString("utf-8");
    const dailyNote = await createFileFromTemplate({
      filename,
      templateContents,
      ctx: {
        shortForecast,
        todayHeader: today.format("ddd MMMM DD, YYYY"),
        temperature,
      },
    });

    workspace.activeLeaf.openFile(dailyNote);
  }

  promptUserToCreateFile(filename: string) {
    document.body.appendChild(
      modal.createConfirmationDialog({
        cta: "Create",
        onAccept: () => this._createDailyNote(filename),
        text: `File ${filename} does not exist. Would you like to create it?`,
        title: "New Daily Note",
      })
    );
  }

  update() {
    this.leaf.empty();
    // const container = this.leaf.createEl("div", {
    //   cls: "calendarview__container",
    // });
    // const monthName = moment().format("MMM YYYY");
    // const heading = htmlToElements(`<h2>${monthName}</h2>`);

    const { activeLeaf } = this.view.app.workspace;
    const vault = this.view.app.vault;

    const onClick = (event: Event) => {
      const td = (<HTMLElement>event.target).closest("td");
      const day = parseInt(td.innerHTML, 10);
      const selectedDate = moment({ day }).format(this.format);

      this._openFileByName(selectedDate);
    };

    const table = new Calendar({
      target: this.leaf,
      props: {
        activeLeaf,
        onClick,
        vault,
        directory: this.directory,
        format: this.format,
      },
    });
  }
}
