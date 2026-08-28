import { clearAuthSession, isSessionActive, readAuthSession } from "../features/auth/authSession.ts";

const configuredApiUrl = import.meta.env?.VITE_TUNAS_API_URL ?? "http://localhost:3000";

export const API_URL = configuredApiUrl.replace(/\/$/, "");

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
  uptime: number;
};

export async function apiFetch(path: string, options?: RequestInit) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(options?.headers);
  const session = readAuthSession();
  if (session && isSessionActive(session) && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  const response = await fetch(`${API_URL}${normalizedPath}`, { ...options, headers });
  if (response.status === 401 && session) clearAuthSession();
  return response;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiFetch("/health");
  if (!response.ok) throw new Error(`API health check failed with status ${response.status}`);
  return response.json() as Promise<HealthResponse>;
}
