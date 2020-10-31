import { App, Modal } from "obsidian";

interface IConfirmationDialogParams {
  cta: string;
  onAccept: (...args: any[]) => Promise<void>;
  text: string;
  title: string;
}

export class ConfirmationModal extends Modal {
  constructor(app: App, config: IConfirmationDialogParams) {
    super(app);

    const { cta, onAccept, text, title } = config;

    this.contentEl.createEl("h2", { text: title });
    this.contentEl.createEl("p", { text });
    this.contentEl
      .createEl("button", { text: "Never mind" })
      .addEventListener("click", () => this.close());

    this.contentEl
      .createEl("button", {
        cls: "mod-cta",
        text: cta,
      })
      .addEventListener("click", async (e) => {
        await onAccept(e);
        this.close();
      });
  }
}

export function createConfirmationDialog(
  app: App,
  { cta, onAccept, text, title }: IConfirmationDialogParams
): void {
  new ConfirmationModal(app, { cta, onAccept, text, title }).open();
}
