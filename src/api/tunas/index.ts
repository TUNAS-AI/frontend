import { apiFetch } from "../http.ts";

export type TunasAction = { id: "keep" | "reschedule" | "regenerate"; label: string };
export type TunasMissionReference = { missionId: string; originalMessage: string; status: string; stage: string };
export type TunasMessage = { tunasMessageId: string; missionId: string | null; mission: TunasMissionReference | null; kind: string; role: "assistant" | "farmer"; content: string; actions: TunasAction[]; readAt: string | null; createdAt: string };
export type TunasState = { messages: TunasMessage[]; unreadCount: number };
export type TunasNavigation = { missionId: string; draft: string; autoGenerate: boolean } | null;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => ({})) as { error?: string };
  throw new Error(body.error || "Tunas AI is unavailable. Try again.");
}

export function getTunasMessages() { return request<TunasState>("/api/tunas/messages"); }
export function checkTunasForecast() { return request<TunasState>("/api/tunas/daily-check", { method: "POST" }); }
export function markTunasRead() { return request<TunasState>("/api/tunas/messages/read", { method: "POST" }); }
export function createTunasTestAlert(scenario: "drying-rain" | "harvest-rain" | "irregular-rain") { return request<TunasState>(`/api/tunas/test-alerts/${scenario}`, { method: "POST" }); }
export function actOnTunasMessage(messageId: string, action: TunasAction["id"]) { return request<{ messages: TunasState; navigation: TunasNavigation }>(`/api/tunas/actions/${messageId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); }
