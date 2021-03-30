import { App, Modal } from "obsidian";

interface IConfirmationDialogParams {
  cta: string;
  // eslint-disable-next-line
  onAccept: (...args: any[]) => Promise<void>;
  text: string;
  title: string;
}

export class ConfirmationModal extends Modal {
  submitEl: HTMLButtonElement;

  onOpen(): void {
    this.submitEl.focus();
  }

  constructor(app: App, config: IConfirmationDialogParams) {
    super(app);

    const { cta, onAccept, text, title } = config;

    this.contentEl.createEl("h2", { text: title });
    this.contentEl.createEl("p", { text });

    this.contentEl.createEl(
      "form",
      { cls: "modal-button-container" },
      (buttonsEl) => {
        buttonsEl
          .createEl("button", { text: "Never mind" })
          .addEventListener("click", () => this.close());

        this.submitEl = buttonsEl.createEl("button", {
          attr: { type: "submit" },
          cls: "mod-cta",
          text: cta,
        });

        buttonsEl.addEventListener("submit", async (e) => {
          e.preventDefault();
          await onAccept(e);
          this.close();
        });
      }
    );
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
