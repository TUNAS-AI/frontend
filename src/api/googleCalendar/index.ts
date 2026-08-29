import { apiFetch } from "@/api/http";

type ApiErrorBody = { error?: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch((): ApiErrorBody => ({}));
    throw new Error(body.error || "Google Calendar is unavailable. Try again.");
  }
  return response.json() as Promise<T>;
}

export type GoogleCalendarStatus = { connected: boolean; calendarName: string | null };
export type GoogleCalendarSyncResult = { synced: number; failed: number; failureReason?: string };
export type GoogleCalendarDisconnectResult = { connected: false; removed: number; failed: number; failureReason?: string };

export function getGoogleCalendarStatus() { return request<GoogleCalendarStatus>("/api/google-calendar"); }
export function beginGoogleCalendarConnection() { return request<{ authorizationUrl: string }>("/api/google-calendar/connect", { method: "POST" }); }
export function syncGoogleCalendar() { return request<GoogleCalendarSyncResult>("/api/google-calendar/sync", { method: "POST" }); }
export function disconnectGoogleCalendar() { return request<GoogleCalendarDisconnectResult>("/api/google-calendar", { method: "DELETE" }); }
