import { useMemo, useState } from "react";
import type { MissionDetailPageData, MissionExecutionStep } from "./detailTypes";
import { deriveScheduledTaskState, findLatestAssumedTask, findNextMissionTask } from "./missionExecution";

export function useMissionExecution(data: MissionDetailPageData) {
  const [steps, setSteps] = useState<MissionExecutionStep[]>(() => deriveScheduledTaskState(data.steps, data.executionAsOf));
  const latestAssumedTask = useMemo(() => findLatestAssumedTask(steps), [steps]);
  const nextTask = useMemo(() => findNextMissionTask(steps), [steps]);

  function reportLatestAssumedTaskIncomplete() {
    if (!latestAssumedTask) return "There is no time-assumed task to correct.";
    setSteps((current) => current.map((step) => step.id === latestAssumedTask.id ? {
      ...step,
      status: "unable-to-continue",
      statusLabel: "Reported not completed",
      completedLabel: undefined,
      completionSource: undefined,
    } : step));
    return `${latestAssumedTask.title} is now recorded as not completed in this demo session. The remaining plan needs an impact review before any schedule change.`;
  }

  function requestMoveForNextTask() {
    if (!nextTask) return "Every task is currently treated as completed.";
    setSteps((current) => current.map((step) => step.id === nextTask.id ? {
      ...step,
      status: "waiting-confirmation",
      statusLabel: "Move requested",
      scheduledLabel: "Waiting for a revised time and approval",
    } : step));
    return `${nextTask.title} is now waiting for a revised time in this demo session. No Calendar event has been changed.`;
  }

  return { latestAssumedTask, nextTask, reportLatestAssumedTaskIncomplete, requestMoveForNextTask, steps };
}
