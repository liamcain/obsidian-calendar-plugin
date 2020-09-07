interface ConfirmationDialogParams {
  cta: string;
  onAccept: (...args: any[]) => void;
  text: string;
  title: string;
}

export function createConfirmationDialog({
  cta,
  onAccept,
  text,
  title,
}: ConfirmationDialogParams): HTMLElement {
  const container = (<any>window).createEl("div", {
    cls: "modal-container",
  });

  container.createEl("div", { cls: "modal-bg" });
  const modal = container.createEl("div", { cls: "modal" });
  modal
    .createEl("div", { cls: "modal-close-button" })
    .addEventListener("click", () => container.remove());
  modal.createEl("div", { cls: "modal-title", text: title });
  modal.createEl("div", { cls: "modal-content" }).createEl("p", { text });
  modal
    .createEl("button", { text: "Never mind" })
    .addEventListener("click", () => container.remove());
  modal
    .createEl("button", {
      cls: "mod-cta",
      text: cta,
    })
    .addEventListener("click", async (e) => {
      await onAccept(e);
      container.remove();
    });

  return container;
}
