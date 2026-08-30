import { apiFetch } from "../http.ts";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options);
  if (response.ok) return response.json() as Promise<T>;
  const body = await response.json().catch(() => ({})) as { error?: string };
  throw new Error(body.error || "Telegram tidak tersedia. Coba lagi.");
}

export type TelegramStatus = { connected: boolean; username: string | null; firstName: string | null; linkedAt: string | null; botUrl: string | null };
export function getTelegramStatus() { return request<TelegramStatus>("/api/telegram"); }
export function beginTelegramConnection() { return request<TelegramStatus & { connectionUrl: string | null }>("/api/telegram/connect", { method: "POST" }); }
