import { App, Modal } from "obsidian";
import type { Moment } from "moment";
import { t } from "../i18n";

interface IConfirmationDialogParams {
  cta: string;
  // eslint-disable-next-line
  onAccept: (...args: any[]) => Promise<void>;
  text: string;
  title: string;
}

export type DateActionMode = "choose" | "create";

export interface IDateActionCallbacks {
  onOpenDailyNote: (date: Moment) => void;
  onAddItem: (date: Moment) => void;
  /**
   * "choose" — ask which note to open when a day has both a daily note and a
   * monthly section. "create" — ask which note to create when it has neither.
   */
  mode?: DateActionMode;
}

/**
 * Modal dialog shown when clicking a calendar date that is ambiguous.
 * It either asks which existing note to open, or which note to create.
 */
export class DateActionModal extends Modal {
  private date: Moment;
  private callbacks: IDateActionCallbacks;

  constructor(app: App, date: Moment, callbacks: IDateActionCallbacks) {
    super(app);
    this.date = date;
    this.callbacks = callbacks;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("date-action-modal");

    const isCreate = this.callbacks.mode === "create";

    // Title
    contentEl.createEl("h2", {
      text: this.date.format("YYYY-MM-DD"),
      cls: "date-action-title",
    });

    // Action buttons container
    const btnContainer = contentEl.createDiv("date-action-buttons");

    // Option 1: Open / create daily note
    const dailyBtn = btnContainer.createEl("button", {
      text: isCreate
        ? t('modal.dateAction.createDailyNote')
        : t('modal.dateAction.openDailyNote'),
      cls: "date-action-btn",
    });
    dailyBtn.addEventListener("click", () => {
      this.close();
      this.callbacks.onOpenDailyNote(this.date);
    });

    // Option 2: Open / create monthly note for editing
    const addBtn = btnContainer.createEl("button", {
      text: isCreate
        ? t('modal.dateAction.createMonthlyNote')
        : t('modal.dateAction.openMonthlyNote'),
      cls: "date-action-btn",
    });
    addBtn.addEventListener("click", () => {
      this.close();
      this.callbacks.onAddItem(this.date);
    });

    // Cancel button
    const cancelBtn = contentEl.createEl("button", {
      text: t('modal.dateAction.cancel'),
      cls: "date-action-cancel",
    });
    cancelBtn.addEventListener("click", () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmationModal extends Modal {
  constructor(app: App, config: IConfirmationDialogParams) {
    super(app);

    const { cta, onAccept, text, title } = config;

    this.contentEl.createEl("h2", { text: title });
    this.contentEl.createEl("p", { text });

    this.contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", { text: t('modal.confirmation.neverMind') })
        .addEventListener("click", () => this.close());

      buttonsEl
        .createEl("button", {
          cls: "mod-cta",
          text: cta,
        })
        .addEventListener("click", async (e) => {
          await onAccept(e);
          this.close();
        });
    });
  }
}

export function createConfirmationDialog({
  cta,
  onAccept,
  text,
  title,
}: IConfirmationDialogParams): void {
  new ConfirmationModal(window.app, { cta, onAccept, text, title }).open();
}
