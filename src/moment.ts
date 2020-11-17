export interface IMoment {
  add: (value: number, prop: string) => IMoment;
  clone: () => IMoment;
  date: (date: number) => IMoment;
  daysInMonth: () => number;
  format: (format: string) => string;
  isoWeekday: () => number;
  subtract: (value: number, prop: string) => IMoment;
  week: () => number;
  weekday: () => number;
  isoWeek: () => number;
}
