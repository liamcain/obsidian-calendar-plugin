import { App, Modal } from "obsidian";

interface IConfirmationDialogParams {
  cta: string;
  onAccept: (...args: any[]) => Promise<void>;
  text: string;
  title: string;
}

export class ConfirmationModal extends Modal {
  constructor(
    app: App,
    cta: string,
    onAccept: (event: Event) => Promise<void>
  ) {
    super(app);

    this.contentEl
      .createEl("button", { text: "Never mind" })
      .addEventListener("click", () => this.containerEl.remove());

    this.contentEl
      .createEl("button", {
        cls: "mod-cta",
        text: cta,
      })
      .addEventListener("click", async (e) => {
        await onAccept(e);
        this.containerEl.remove();
      });
  }
}

export function createConfirmationDialog({
  cta,
  onAccept,
  text,
  title,
}: IConfirmationDialogParams): void {
  new ConfirmationModal(app, cta, onAccept).open();
}
