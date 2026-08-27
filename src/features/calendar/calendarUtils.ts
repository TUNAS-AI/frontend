import type { ApprovedMissionEvent } from "./types";

export type CalendarDay = {
  date: string;
  dayNumber: number;
  events: ApprovedMissionEvent[];
  isCurrentMonth: boolean;
  isReferenceDate: boolean;
};

function parseMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error(`Invalid calendar month: ${month}`);
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}

function toIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function buildMonthGrid(month: string, referenceDate: string, events: ApprovedMissionEvent[]): CalendarDay[] {
  const { year, monthIndex } = parseMonth(month);
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const mondayFirstOffset = (firstDay.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((mondayFirstOffset + daysInMonth) / 7) * 7;
  const gridStart = new Date(Date.UTC(year, monthIndex, 1 - mondayFirstOffset));

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    const isoDate = toIsoDate(date);
    return {
      date: isoDate,
      dayNumber: date.getUTCDate(),
      events: events.filter((event) => event.date === isoDate),
      isCurrentMonth: date.getUTCMonth() === monthIndex,
      isReferenceDate: isoDate === referenceDate,
    };
  });
}

export function shiftMonth(month: string, offset: number) {
  const { year, monthIndex } = parseMonth(month);
  const shifted = new Date(Date.UTC(year, monthIndex + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string) {
  const { year, monthIndex } = parseMonth(month);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
