import type { MissionExecutionStep } from "./detailTypes";

export function deriveScheduledTaskState(steps: readonly MissionExecutionStep[], asOf: string) {
  const asOfTime = new Date(asOf).getTime();
  return steps.map((step) => {
    const scheduledEnd = step.scheduledEnd ? new Date(step.scheduledEnd).getTime() : Number.NaN;
    const canAdvance = step.status === "scheduled" || step.status === "in-progress";
    if (!canAdvance || !Number.isFinite(scheduledEnd) || scheduledEnd > asOfTime) return { ...step };
    return {
      ...step,
      status: "completed" as const,
      statusLabel: "Completed by schedule",
      completedLabel: "Scheduled window elapsed",
      completionSource: "assumed-by-time" as const,
    };
  });
}

export function findLatestAssumedTask(steps: readonly MissionExecutionStep[]) {
  return [...steps].reverse().find((step) => step.completionSource === "assumed-by-time") ?? null;
}

export function findNextMissionTask(steps: readonly MissionExecutionStep[]) {
  return steps.find((step) => step.status !== "completed") ?? null;
}
