import type { Moment } from "moment";
import { App, Modal } from "obsidian";

interface IConfirmationDialogParams {
  cta: string;
  // eslint-disable-next-line
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

    this.contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", { text: "Never mind" })
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export class JumpToDateModal extends Modal {
  private year: number;
  private readonly initialMonthIndex: number;
  private readonly onPick: (target: Moment) => void;

  constructor(app: App, initialMonth: Moment, onPick: (target: Moment) => void) {
    super(app);
    this.year = initialMonth.year();
    this.initialMonthIndex = initialMonth.month();
    this.onPick = onPick;
  }

  onOpen(): void {
    this.titleEl.setText("Jump to date");
    this.renderYearStep();
  }

  private renderYearStep(): void {
    const { contentEl } = this;
    contentEl.empty();

    const row = contentEl.createDiv({ cls: "jump-to-date-year-row" });

    row
      .createEl("button", { text: "←", attr: { "aria-label": "Previous year" } })
      .addEventListener("click", () => {
        this.year -= 1;
        input.value = String(this.year);
        input.focus();
      });

    const input = row.createEl("input", {
      type: "text",
      attr: { inputmode: "numeric", "aria-label": "Year" },
    });
    input.value = String(this.year);
    input.addEventListener("input", () => {
      const parsed = parseInt(input.value, 10);
      if (Number.isFinite(parsed)) {
        this.year = parsed;
      }
    });
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && this.isYearValid()) {
        e.preventDefault();
        this.renderMonthStep();
      }
    });

    row
      .createEl("button", { text: "→", attr: { "aria-label": "Next year" } })
      .addEventListener("click", () => {
        this.year += 1;
        input.value = String(this.year);
        input.focus();
      });

    contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", { text: "Cancel" })
        .addEventListener("click", () => this.close());

      const nextBtn = buttonsEl.createEl("button", {
        cls: "mod-cta",
        text: "Next",
      });
      nextBtn.addEventListener("click", () => {
        if (this.isYearValid()) {
          this.renderMonthStep();
        }
      });
    });

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  private renderMonthStep(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("p", {
      text: `Pick a month in ${this.year}:`,
      cls: "jump-to-date-month-label",
    });

    const grid = contentEl.createDiv({ cls: "jump-to-date-month-grid" });
    MONTH_NAMES.forEach((name, index) => {
      const btn = grid.createEl("button", { text: name });
      if (index === this.initialMonthIndex) {
        btn.addClass("mod-cta");
      }
      btn.addEventListener("click", () => {
        const target = window.moment({ year: this.year, month: index, day: 1 });
        this.onPick(target);
        this.close();
      });
    });

    contentEl.createDiv("modal-button-container", (buttonsEl) => {
      buttonsEl
        .createEl("button", { text: "Back" })
        .addEventListener("click", () => this.renderYearStep());
      buttonsEl
        .createEl("button", { text: "Cancel" })
        .addEventListener("click", () => this.close());
    });
  }

  private isYearValid(): boolean {
    return Number.isFinite(this.year) && this.year >= 1 && this.year <= 9999;
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
