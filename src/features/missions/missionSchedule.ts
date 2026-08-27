import type { DateRangeSchedule, MissionSchedule } from "./types";

export type MissionScheduleSummary = {
  label: "Working window" | "Plan duration";
  value: string;
  detail: string;
};

function formatScheduleDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function getMissionScheduleSummary(schedule: MissionSchedule): MissionScheduleSummary {
  if (schedule.type === "daily-window") {
    return {
      label: "Working window",
      value: `${schedule.startTime}-${schedule.endTime}`,
      detail: "Planned start to finish",
    };
  }

  return {
    label: "Plan duration",
    value: schedule.durationLabel,
    detail: `${formatScheduleDate(schedule.startDate)} - ${formatScheduleDate(schedule.endDate)}`,
  };
}

export function getNextActivitySummary(schedule: DateRangeSchedule) {
  if (!schedule.nextActivity) return null;
  const time = schedule.nextActivity.timeWindow
    ? ` · ${schedule.nextActivity.timeWindow.startTime}-${schedule.nextActivity.timeWindow.endTime}`
    : "";
  return `${schedule.nextActivity.label} · ${formatScheduleDate(schedule.nextActivity.date)}${time}`;
}
