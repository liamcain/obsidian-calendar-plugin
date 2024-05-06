import type { Moment } from "moment";
import type { TFile } from "obsidian";
import {
    createDailyNote,
    createWeeklyNote,
    createMonthlyNote,
    createYearlyNote,
    getDailyNoteSettings,
    getWeeklyNoteSettings,
    getMonthlyNoteSettings,
    getYearlyNoteSettings,
} from "obsidian-daily-notes-interface";

import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

export enum Period {
    Daily = "Daily",
    Weekly = "Weekly",
    Monthly = "Monthly",
    Yearly = "Yearly"
}

export const getDateForPeriodicNote = (date: Moment, noteType: Period) => {
    switch (noteType) {
      case Period.Daily:
        return date;
      case Period.Weekly:
        return date.startOf("week");
      case Period.Monthly:
        return date.startOf("month");
      case Period.Yearly:
        return date.startOf("year");
    }
  }
const getCreateNoteFunction = (noteType: Period) => {
    switch (noteType) {
        case Period.Daily:
            return createDailyNote;
        case Period.Weekly:
            return createWeeklyNote;
        case Period.Monthly:
            return createMonthlyNote;
        case Period.Yearly:
            return createYearlyNote;
    }
};

const getNoteSettingsGetter = (noteType: Period) => {
    switch (noteType) {
        case Period.Daily:
            return getDailyNoteSettings;
        case Period.Weekly:
            return getWeeklyNoteSettings;
        case Period.Monthly:
            return getMonthlyNoteSettings;
        case Period.Yearly:
            return getYearlyNoteSettings;
    }
};

/**
 * Create a Daily Note for a given date.
 */
export async function tryToCreatePeriodicNote(
    date: Moment,
    inNewSplit: boolean,
    settings: ISettings,
    noteType: Period,
    cb?: (newFile: TFile) => void
): Promise<void> {
    const noteCreator = getCreateNoteFunction(noteType);
    const noteSettingsGetter = getNoteSettingsGetter(noteType);

    const { workspace } = window.app;
    const { format } = noteSettingsGetter();
    const filename = date.format(format);


    const createFile = async () => {
        const note = await noteCreator(date);
        const leaf = inNewSplit
            ? workspace.splitActiveLeaf()
            : workspace.getUnpinnedLeaf();

        await leaf.openFile(note, { active: true });
        cb?.(note);
    };

    if (settings.shouldConfirmBeforeCreate) {
        createConfirmationDialog({
            cta: "Create",
            onAccept: createFile,
            text: `File ${filename} does not exist. Would you like to create it?`,
            title: `New ${noteType} Note test`,
        });
    } else {
        await createFile();
    }
}
