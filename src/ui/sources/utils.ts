import type { IDot } from "obsidian-calendar-ui";

export const emptyDot = (): IDot => ({ isFilled: false });
export const filledDot = (): IDot => ({ isFilled: true });
