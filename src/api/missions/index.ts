import { apiFetch } from "../http.ts";

export type MissionStatus = "ACTIVE" | "CLOSEOUT" | "COMPLETED";
export type MissionStage = "WAITING" | "HARVESTING" | "DRYING" | "FINISHED" | "TO_REVIEW" | "COMPLETED";
export type MissionStepStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
export type MissionCloseoutInput = { actualHarvestKg: number; actualDriedKg: number; harvestedAreaHectares: number | null; dryingCompleted: boolean; rejectedKg: number | null; notes: string | null };
export type FactConfidence = "high" | "medium" | "low";
export type FactProvenance = "FARMER_REPORTED" | "INFERRED";
export type MissionReviewStatus = "confirmed" | "needs_clarification" | "missing";

export type MissionMessage = { role: "farmer" | "assistant"; content: string };
export type MissionFacts = {
  fieldBlockId: string | null;
  cropBatchIds: string[];
  readinessConfirmed: boolean | null;
  destination: "IMMEDIATE_SALE" | "CONSUMPTION_STORAGE" | "SEED_STOCK" | null;
  plannedHarvestKg: number | null;
  deadlineAt: string | null;
  notes: string | null;
  clarification: { key: string; question: string } | null;
};
export type MissionFactReview = { key: keyof Omit<MissionFacts, "clarification">; status: MissionReviewStatus; reason: string; provenance: FactProvenance; confidence: FactConfidence };
export type MissionFactBlock = { key: string; value: unknown; provenance: FactProvenance; confidence: FactConfidence };
export type MissionManualOptions = { timezone: string; fieldBlocks: Array<{ fieldBlockId: string; name: string }>; cropBatches: Array<{ cropBatchId: string; fieldBlockId: string; label: string }> };
export type MissionPreviewCandidate = { previewId: string; messages: MissionMessage[]; facts: MissionFacts; review: MissionFactReview[]; blocks: MissionFactBlock[]; manualOptions?: MissionManualOptions };
export type MissionPreviewInterpretation = MissionPreviewCandidate;
export type MissionActionKind = "CONFIRM_READINESS_WEATHER" | "PREPARE_CREW_TOOLS" | "HARVEST" | "BUNDLE_COLLECT" | "TRANSFER_TO_DRYING" | "SET_UP_DRYING" | "BEGIN_DRYING" | "TURN_OR_REARRANGE" | "INSPECT_DRYING" | "DEPLOY_RAIN_PROTECTION" | "REMOVE_RAIN_PROTECTION" | "CONFIRM_DRYING_COMPLETE";
export type MissionScheduleType = "DAILY_WINDOW" | "CONDITION_GATE";
export type MissionPlanActivity = { title: string; description: string; actionKind: MissionActionKind; scheduleType: MissionScheduleType; startsOn: string; endsOn: string; windowStart: string | null; windowEnd: string | null; timezone: string; isConditional: boolean; stage: "HARVESTING" | "DRYING"; targetHarvestKg?: number | null; quantityKg?: number | null; workers?: number | null };
export type MissionEvidence = { evidenceId: string; source: "WEATHER" | "MISSION_CONSTRAINT" | "RESOURCE" | "DEPENDENCY"; rule: string; passed: boolean; value: string | number | boolean | null };
export type MissionRecommendationReason = { text: string; evidenceRefs: string[] };
export type MissionPreviewPlan = { planId: string; name: string; summary: string; evidence: MissionEvidence[]; tradeoffs: string[]; assumptions: string[]; risks: Record<string, string>; dryingEstimateDays: number; dryingEstimateMinDays: number; dryingEstimateMaxDays: number; dryingEstimateReason: string; weatherStatus: "VERIFIED" | "WEATHER_UNVERIFIED"; activities: MissionPlanActivity[] };
export type MissionPlanRecommendation = { planId: string; reasons: MissionRecommendationReason[] };
export type MissionPlanPreview =
  | { status: "feasible"; missionId: string; candidates: MissionPreviewPlan[]; recommendation: MissionPlanRecommendation | null; previewToken: string; expiresInSeconds: number }
  | { status: "infeasible"; missionId: string; blockers: string[] };
export type MissionDeletionResult = { missionId: string; calendarCleanup: { removed: number; failed: number; failureReason?: string } };

export type MissionStep = {
  missionStepId: string;
  sequence: number;
  title: string;
  description: string;
  actionKind: MissionActionKind;
  scheduleType: MissionScheduleType;
  startsOn: string;
  endsOn: string;
  windowStart: string | null;
  windowEnd: string | null;
  timezone: string;
  isConditional: boolean;
  stage: "HARVESTING" | "DRYING";
  status: MissionStepStatus;
  targetHarvestKg?: number | null;
};

export type CalendarMissionStep = MissionStep & { missionId: string; mission: { originalMessage: string } };

export type MissionPlan = {
  planId: string;
  name: string;
  summary: string;
  recommended: boolean;
  assumptions: string[];
  risks: Record<string, string>;
  dryingEstimateDays: number;
  dryingEstimateReason: string;
};

export type MissionConstraint = {
  missionConstraintId: string;
  key: string;
  value: unknown;
  provenance: "FARMER_REPORTED" | "INFERRED";
  confidence: "high" | "medium" | "low";
};

export type MissionListItem = {
  missionId: string;
  fieldBlockId: string | null;
  fieldBlock: { fieldBlockId: string; name: string } | null;
  status: MissionStatus;
  stage: MissionStage;
  originalMessage: string;
  plannedHarvestKg: number | null;
  destination: MissionFacts["destination"];
  deadlineAt: string | null;
  approvedPlanName: string | null;
  createdAt: string;
  cropBatches: Array<{ cropBatchId: string; cropBatch: { cropBatchId: string; variety: string | null } }>;
  missionSteps: MissionStep[];
};

export type Mission = MissionListItem & {
  notes: string | null;
  approvedPlanId: string | null;
  updatedAt: string;
  messages: MissionMessage[];
  constraints: MissionConstraint[];
  planningRuns: Array<{ plans: MissionPlan[] }>;
  closeout: { plannedHarvestKg: number; plannedDriedKg: number; actualHarvestKg: number; actualDriedKg: number; harvestedAreaHectares: number | null; dryingCompleted: boolean; rejectedKg: number | null; notes: string | null; summary: { summary: string; lessons: string[] } | null } | null;
};

type ApiErrorBody = { error?: string; code?: string };

export class MissionApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "MissionApiError";
    this.status = status;
    this.code = code;
  }
}

export function isStaleMissionApproval(error: unknown) {
  return error instanceof MissionApiError && ["PREVIEW_EXPIRED", "PREVIEW_STALE", "PREVIEW_TOKEN_INVALID"].includes(error.code ?? "");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch((): ApiErrorBody => ({}));
  throw new MissionApiError(body.error || "We could not load missions. Try again.", response.status, typeof body.code === "string" ? body.code : null);
}

export function getMissions() { return request<MissionListItem[]>("/api/missions"); }
export function getCalendarMissionSteps(from: string, to: string) { return request<CalendarMissionStep[]>(`/api/missions/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`); }
export function getMission(id: string) { return request<Mission>(`/api/missions/${id}`); }
export function deleteMission(id: string) { return request<MissionDeletionResult>(`/api/missions/${id}`, { method: "DELETE" }); }
export function advanceMissionStage(id: string, stage: "HARVESTING" | "DRYING" | "FINISHED" | "TO_REVIEW") { return request<Mission>(`/api/missions/${id}/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) }); }
export function completeMissionStep(id: string, stepId: string) { return request<Mission>(`/api/missions/${id}/steps/${stepId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) }); }
export function saveMissionCloseout(id: string, input: MissionCloseoutInput) { return request<Mission>(`/api/missions/${id}/closeout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); }
export function confirmMissionCloseout(id: string) { return request<Mission>(`/api/missions/${id}/closeout/confirm`, { method: "POST" }); }
export function interpretMissionPreview(input: { previewId?: string; messages?: MissionMessage[]; message: string; facts?: MissionFacts }) {
  return request<MissionPreviewInterpretation>("/api/mission-previews/interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}
export function planMissionPreview(candidate: MissionPreviewCandidate) {
  return request<MissionPlanPreview>("/api/mission-previews/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidate }) });
}
export function confirmMissionPreview(previewToken: string, planId: string) {
  return request<Mission>("/api/missions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ previewToken, planId }) });
}
export function getMissionReplanDraft(id: string) { return request<MissionPreviewCandidate>(`/api/missions/${id}/replan`); }
export function interpretMissionReplan(id: string, input: { previewId?: string; messages?: MissionMessage[]; message: string; facts?: MissionFacts }) {
  return request<MissionPreviewInterpretation>(`/api/missions/${id}/replan/interpret`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}
export function planMissionReplan(id: string, candidate: MissionPreviewCandidate) {
  return request<MissionPlanPreview>(`/api/missions/${id}/replan/plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidate }) });
}
export function confirmMissionReplan(id: string, previewToken: string, planId: string) {
  return request<{ mission: Mission; calendarSync: { status: string } }>(`/api/missions/${id}/replan/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ previewToken, planId }) });
}
