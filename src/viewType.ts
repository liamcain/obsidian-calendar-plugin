const clsx = require("clsx");

import * as moment from "moment";
import {
  modal,
  template,
  BasePlugin,
  BaseViewType,
  View,
} from "obsidian-shared-utils";

import { VIEW_TYPE_CALENDAR } from "./constants";
import { htmlToElements } from "./utils";

export default class CalendarViewType extends BaseViewType {
  directory: string;
  format: string;
  volcanoPath: string;

  constructor(view: View, volcanoPath: string) {
    super(view);

    this.volcanoPath = volcanoPath;
    this.directory = "";
    this.format = "YYYY-MM-DD";

    this._openFileByName = this._openFileByName.bind(this);
    this._getMonthCalendar = this._getMonthCalendar.bind(this);
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

  _getMonthCalendar() {
    const { activeLeaf } = this.view.app.workspace;
    const startDate = moment({ day: 1 });
    const vault = this.view.app.vault;
    const { fs, path } = this.view.app.vault.adapter;

    let calendar = `
              <table class="calendarview__table">
              <thead>
                  <tr>
                  <th align="center">S</th>
                  <th align="center">M</th>
                  <th align="center">T</th>
                  <th align="center">W</th>
                  <th align="center">H</th>
                  <th align="center">F</th>
                  <th align="center">S</th>
                  </tr>
              </thead>
              <tbody>
          `;
    const today = moment().date();
    const activeFile = activeLeaf?.view.file?.path;

    let offset = startDate.isoWeekday() + 1;
    let day = 1;
    for (let weekNum = 0; weekNum <= 5; weekNum++) {
      calendar += "<tr>";
      for (let weekday = 1; weekday <= 7; weekday++) {
        const formattedDate = `${moment({ day }).format(this.format)}.md`;
        const i = weekNum * 6 + weekday;
        const classes = clsx({
          "calendarview__day--today": day === today,
          "calendarview__day--active": formattedDate === activeFile,
        });

        const fileForDay = vault.getAbstractFileByPath(
          path.join(this.directory, formattedDate)
        );

        if (i < offset || day > startDate.daysInMonth()) {
          calendar += '<td align="center"></td>';
        } else {
          const fileSize = fileForDay?.stat?.size || 0;
          const numDots = fileSize ? Math.floor(Math.log(fileSize / 20)) : 0;
          const dots = numDots
            ? `<div class='dot-container'>${Array(numDots).join(
                "<div class='calendar-dot'></div>"
              )}</div>`
            : "";
          calendar += `<td align="center" class="${classes}">${day}${dots}</td>`;
          day++;
        }
      }

      calendar += "</tr>";
      if (day >= startDate.daysInMonth()) {
        break;
      }
    }

    calendar += `
          </tbody>
      </table>
    `;

    return htmlToElements(calendar);
  }

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

    console.log("filename", filename);

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

    const templateContents = vault.adapter.fs
      .readFileSync(`${this.volcanoPath}/templates/daily_note.hbs`)
      .toString("utf-8");
    const dailyNote = await template.createFileFromTemplate({
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

  promptUserToCreateFile(filename) {
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
    const container = this.leaf.createEl("div", {
      cls: "calendarview__container",
    });
    const monthName = moment().format("MMM YYYY");
    const heading = htmlToElements(`<h2>${monthName}</h2>`);

    const table = this._getMonthCalendar();
    table.addEventListener("click", (event) => {
      const td = (<HTMLElement>event.target).closest("td");
      const day = parseInt(td.innerHTML, 10);
      const selectedDate = moment({ day }).format(this.format);

      this._openFileByName(selectedDate);
    });

    container.appendChild(heading);
    container.appendChild(table);
    this.leaf.append(container);
  }
}
