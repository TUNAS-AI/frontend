import { apiFetch } from "../http.ts";

export type TunasAction = { id: "keep" | "reschedule" | "regenerate"; label: string };
export type TunasMissionReference = { missionId: string; originalMessage: string; status: string; stage: string };
export type TunasMessage = { tunasMessageId: string; missionId: string | null; mission: TunasMissionReference | null; kind: string; role: "assistant" | "farmer"; content: string; actions: TunasAction[]; readAt: string | null; telegramSentAt: string | null; telegramMessageId: string | null; createdAt: string };
export type TunasState = { messages: TunasMessage[]; unreadCount: number };
export type TunasNavigation = { missionId: string; draft: string; autoGenerate: boolean } | null;
export type OperationalReportType = "ACTIVITY_STARTED" | "ACTIVITY_COMPLETED" | "ACTUAL_QUANTITY_REPORTED" | "WORKER_AVAILABILITY_CHANGED" | "BUYER_REQUIREMENT_CHANGED" | "DRYING_RESOURCE_CHANGED" | "RAIN_OR_FIELD_EVENT" | "MISSION_DEVIATION" | "GENERAL_OPERATIONAL_NOTE";
type ReportBase<T extends OperationalReportType, P> = { reportType: T; observedAt: string; missionStepId?: string; fieldBlockId?: string; cropBatchId?: string; narrative?: string; supersedesReportId?: string; payload: P };
export type OperationalReport =
  | ReportBase<"ACTIVITY_STARTED" | "ACTIVITY_COMPLETED", { missionStepId: string }>
  | ReportBase<"ACTUAL_QUANTITY_REPORTED", { quantityKg: number }>
  | ReportBase<"WORKER_AVAILABILITY_CHANGED", { availableWorkers: number; effectiveAt?: string }>
  | ReportBase<"BUYER_REQUIREMENT_CHANGED", { targetQuantityKg: number; quantityBasis: "HARVESTED" | "DRIED"; deadline?: string }>
  | ReportBase<"DRYING_RESOURCE_CHANGED", { available: boolean; protectionAvailable?: boolean }>
  | ReportBase<"RAIN_OR_FIELD_EVENT", { event: string; observedAt: string }>
  | ReportBase<"MISSION_DEVIATION", { description: string }>
  | ReportBase<"GENERAL_OPERATIONAL_NOTE", { text: string }>;
export type TunasImpact = { level: "NONE" | "MATERIAL"; reasons: string[]; replanSupported: boolean };
export type TunasSemanticAction = { type: "APPROVE_REPORT" | "REJECT_REPORT" | "OPEN_REPLAN"; missionId: string; pendingActionId?: string };
export type TunasPendingAction = { pendingActionId: string; kind: string; status: string; preview: { before?: unknown; after?: unknown; question?: string; report?: OperationalReport }; actions?: { approve: string; reject: string } };
export type TunasInteractionState = { threadId: string; interactionId: string; missionId: string | null; trigger: string; message: string; pendingAction: TunasPendingAction | null; impact?: TunasImpact; semanticActions?: TunasSemanticAction[] };
export type TunasInteraction = { operationalInteractionId: string; message: string; response: TunasInteractionState; createdAt: string; completedAt: string | null };
export type TunasTimelineEvent = { operationalEventId: string; actor: string; channel: string; type: string; before: unknown; after: unknown; metadata: unknown; createdAt: string; pendingActionId?: string | null };
export type TunasMissionTimeline = { missionId: string; events: TunasTimelineEvent[] };
export type OperationalReportRecord = {
  operationalReportId: string;
  farmId: string;
  missionId: string;
  missionStepId: string | null;
  fieldBlockId: string | null;
  cropBatchId: string | null;
  operationalInteractionId: string;
  channel: string;
  reportType: OperationalReportType;
  observedAt: string;
  payload: OperationalReport["payload"];
  narrative: string | null;
  acceptedAt: string;
  supersedesReportId: string | null;
  createdAt: string;
};
export type TunasMissionReports = { missionId: string; reports: OperationalReportRecord[] };
export type TunasInteractionInput =
  | { message: string; missionId?: string; channel: "web"; externalMessageId: string }
  | { report: OperationalReport; missionId: string; channel: "web"; externalMessageId: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => ({})) as { error?: string };
  throw new Error(body.error || "Tunas AI is unavailable. Try again.");
}

export function getTunasMessages() { return request<TunasState>("/api/tunas/messages"); }
export function checkTunasForecast() { return request<TunasState>("/api/tunas/daily-check", { method: "POST" }); }
export function markTunasRead() { return request<TunasState>("/api/tunas/messages/read", { method: "POST" }); }
export function createTunasTestAlert(missionId: string, scenario: "drying-rain" | "harvest-rain" | "irregular-rain") { return request<TunasState & { delivered: true; telegramMessageId: string }>(`/api/tunas/test-alerts/${scenario}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId }) }); }
export function actOnTunasMessage(messageId: string, action: TunasAction["id"]) { return request<{ messages: TunasState; navigation: TunasNavigation }>(`/api/tunas/actions/${messageId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); }
export function getTunasInteractions() { return request<{ interactions: TunasInteraction[] }>("/api/tunas/interactions"); }
function postTunasInteraction(input: TunasInteractionInput) { return request<TunasInteractionState>("/api/tunas/interactions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": input.externalMessageId }, body: JSON.stringify(input) }); }
export function sendTunasInteraction(message: string, externalMessageId: string, missionId?: string) { return postTunasInteraction({ message, ...(missionId ? { missionId } : {}), channel: "web", externalMessageId }); }
export function sendTunasReport(missionId: string, report: OperationalReport, externalMessageId: string) { return postTunasInteraction({ report, missionId, channel: "web", externalMessageId }); }
export function approveTunasPendingAction(pendingActionId: string) { return request<TunasInteractionState>(`/api/tunas/pending/${encodeURIComponent(pendingActionId)}/approve`, { method: "POST" }); }
export function rejectTunasPendingAction(pendingActionId: string) { return request<TunasInteractionState>(`/api/tunas/pending/${encodeURIComponent(pendingActionId)}/reject`, { method: "POST" }); }
export function getTunasMissionTimeline(missionId: string) { return request<TunasMissionTimeline>(`/api/tunas/missions/${encodeURIComponent(missionId)}/timeline`); }
export function getTunasMissionReports(missionId: string) { return request<TunasMissionReports>(`/api/tunas/missions/${encodeURIComponent(missionId)}/reports`); }
