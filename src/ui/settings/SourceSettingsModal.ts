import { App, Modal, Setting } from "obsidian";
import type {
  ICalendarSource,
  ISourceDisplayOption,
  ISourceSettings,
} from "obsidian-calendar-ui";

import { settings } from "../stores";

export default class SourceSettingsModal extends Modal {
  constructor(
    app: App,
    source: ICalendarSource,
    saveSource: (settings: Partial<ISourceSettings>) => void,
    handleTeardown: () => void
  ) {
    super(app);

    this.onClose = handleTeardown;
    this.close = this.close.bind(this);

    const sourceSettings = settings.getSourceSettings<ISourceSettings>(
      source.id
    );
    const displayValue = sourceSettings.display;

    this.contentEl.createEl("h3", {
      text: `${source.name} Settings`,
    });

    if (source.description) {
      this.contentEl.createEl("div", {
        cls: "setting-item-description",
        text: source.description,
      });
    }

    new Setting(this.contentEl).setName("Display").addDropdown((dropdown) => {
      dropdown
        .addOption("calendar-and-menu", "On Calendar")
        .addOption("menu", "In Menu")
        .addOption("none", "Hidden")
        .onChange((display: ISourceDisplayOption) => {
          saveSource({ display });
        })
        .setValue(displayValue);
    });

    source.registerSettings?.(this.contentEl, sourceSettings, saveSource);

    this.contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", {
          cls: "mod-cta",
          text: "Close",
        })
        .addEventListener("click", this.close);
    });
  }
}
