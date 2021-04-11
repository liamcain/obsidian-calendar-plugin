import { App, Modal } from "obsidian";
import type { SvelteComponent } from "svelte";

import Palette from "./Palette.svelte";

interface IProps {
  close: () => void;
  setValue: (val: string) => void;
  value: string;
}

export default class MobileColorModal extends Modal {
  private palette: SvelteComponent;
  private handleTeardown: () => void;

  public onClose(): void {
    this.handleTeardown();
    this.palette?.$destroy();
  }

  constructor(app: App, props: IProps) {
    super(app);
    this.close = this.close.bind(this);
    this.handleTeardown = props.close;

    this.palette = new Palette({
      target: this.contentEl,
      props: {
        isMobile: true,
        ...props,
      },
    });

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
