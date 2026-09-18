import { App, Modal } from "obsidian";
import type { CalendarEvent } from "src/events/types";
import EventModalComponent from "./EventModal.svelte";
import { eventsStore } from "src/events/store";

export function openEventModal(
  app: App,
  dateStr: string,
  existingEvent: CalendarEvent | null = null,
  onAfterSave?: () => void
): void {
  const modal = new Modal(app);
  // amplia largura para conforto
  modal.contentEl.addClass("calendar-event-modal-container");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (modal as any).modalEl.style.width = "520px";

  const handleSave = (data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    if (data.id && existingEvent) {
      eventsStore.updateEvent({
        ...existingEvent,
        ...data,
        id: data.id,
      } as CalendarEvent);
    } else {
      // remove id temporário se houver
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = data;
      eventsStore.addEvent(rest as Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">);
    }
    modal.close();
    onAfterSave?.();
  };

  const handleClose = () => modal.close();

  const comp = new EventModalComponent({
    target: modal.contentEl,
    props: {
      dateStr,
      event: existingEvent,
      onSave: handleSave,
      onClose: handleClose,
    },
  });

  modal.onClose = () => {
    comp.$destroy();
  };

  modal.open();
}
