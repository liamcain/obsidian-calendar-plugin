import type { IDot } from "obsidian-calendar-ui";

export const emptyDot = (): IDot => ({ isFilled: false });
export const emptyDots = (numDots: number): IDot[] =>
  numDots ? [...Array(numDots).keys()].map(emptyDot) : [];

export const filledDot = (): IDot => ({ isFilled: true });
export const filledDots = (numDots: number): IDot[] =>
  numDots ? [...Array(numDots).keys()].map(filledDot) : [];
