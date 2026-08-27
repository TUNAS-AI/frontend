import type { Confidence, FactProvenance, MissionSchedule, RiskLevel } from "./types";

export type MissionExecutionStepStatus =
  | "completed"
  | "in-progress"
  | "scheduled"
  | "waiting-confirmation"
  | "unable-to-continue";

export type MissionTaskCompletionSource = "user-confirmed" | "assumed-by-time";

export type MissionExecutionStep = {
  id: string;
  title: string;
  description: string;
  status: MissionExecutionStepStatus;
  statusLabel: string;
  scheduledLabel?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  completedLabel?: string;
  completionSource?: MissionTaskCompletionSource;
};

export type MissionDetailPageData = {
  id: string;
  sourceLabel: string;
  title: string;
  objective: string;
  statusLabel: string;
  risk: RiskLevel;
  riskLabel: string;
  freshness: string;
  executionAsOf: string;
  schedule: MissionSchedule;
  deadline?: { label: string; dateTime: string };
  originalRequest: string;
  context: Array<{
    id: string;
    label: string;
    value: string;
    provenance: FactProvenance;
    confidence: Confidence;
  }>;
  plan: {
    name: string;
    summary: string;
    constraint: string;
    expectedResult: string;
  };
  nextAction: {
    title: string;
    description: string;
  };
  steps: MissionExecutionStep[];
  impact: {
    title: string;
    description: string;
    tone: "info" | "warning";
  };
  approvalHistory: Array<{
    id: string;
    label: string;
    detail: string;
    dateTime: string;
    timeLabel: string;
  }>;
  assistant: {
    contextLabel: string;
    starterMessage: string;
    responses: Array<{ id: string; keywords: string[]; text: string }>;
    fallbackResponse: string;
  };
  closeout: {
    prompt: string;
    actualAmount?: { label: string; unit: string; expectedLabel: string };
    outcomeHelper: string;
    deviationHelper: string;
  };
};

export type MissionCloseoutDraft = {
  tasksCompleted: "yes" | "no";
  actualAmount?: string;
  outcome: string;
  deviation: string;
};
