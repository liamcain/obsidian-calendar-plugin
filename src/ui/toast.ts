/**
 * Toast elegante seguindo tema Obsidian (variáveis CSS).
 * Não usa Notice nativo para permitir customização e múltiplos toasts.
 */

let container: HTMLElement | null = null;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement("div");
  container.addClass("calendar-toast-container");
  document.body.appendChild(container);
  return container;
}

export interface ToastOptions {
  title: string;
  message?: string;
  color?: string;
  durationMs?: number;
  onDismiss?: () => void;
  onSnooze?: () => void;
}

export function showCalendarToast(opts: ToastOptions): void {
  const c = ensureContainer();
  const el = document.createElement("div");
  el.addClass("calendar-toast");
  if (opts.color) el.style.borderLeftColor = opts.color;

  const header = document.createElement("div");
  header.addClass("calendar-toast-header");
  const dot = document.createElement("span");
  dot.addClass("calendar-toast-dot");
  if (opts.color) dot.style.background = opts.color;
  header.appendChild(dot);
  const titleEl = document.createElement("strong");
  titleEl.setText(opts.title);
  header.appendChild(titleEl);
  const closeBtn = document.createElement("button");
  closeBtn.setText("×");
  closeBtn.addClass("calendar-toast-close");
  closeBtn.addEventListener("click", () => dismiss());
  header.appendChild(closeBtn);

  el.appendChild(header);

  if (opts.message) {
    const msg = document.createElement("div");
    msg.addClass("calendar-toast-message");
    msg.setText(opts.message);
    el.appendChild(msg);
  }

  if (opts.onSnooze) {
    const actions = document.createElement("div");
    actions.addClass("calendar-toast-actions");
    const snoozeBtn = document.createElement("button");
    snoozeBtn.setText("Adiar 10 min");
    snoozeBtn.addEventListener("click", () => {
      opts.onSnooze?.();
      dismiss();
    });
    actions.appendChild(snoozeBtn);
    const dismissBtn = document.createElement("button");
    dismissBtn.setText("Dispensar");
    dismissBtn.addClass("mod-cta");
    dismissBtn.addEventListener("click", () => dismiss());
    actions.appendChild(dismissBtn);
    el.appendChild(actions);
  }

  c.appendChild(el);
  // animação
  setTimeout(() => el.addClass("is-visible"), 10);

  const duration = opts.durationMs ?? 8000;
  let timer: number | null = window.setTimeout(() => dismiss(), duration);

  function dismiss() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    el.removeClass("is-visible");
    setTimeout(() => {
      el.remove();
      opts.onDismiss?.();
      if (c.childElementCount === 0) {
        c.remove();
        container = null;
      }
    }, 300);
  }

  el.addEventListener("mouseenter", () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  });
  el.addEventListener("mouseleave", () => {
    if (timer === null) timer = window.setTimeout(() => dismiss(), 3000);
  });
}
