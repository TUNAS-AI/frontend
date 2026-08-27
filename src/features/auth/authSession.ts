import type { AuthSession } from "./types";

export type SessionStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type GoogleIdentity = {
  userId: string;
  email: string | null;
  displayName: string | null;
};

export type AuthRequest = (path: string, options?: RequestInit) => Promise<Response>;

const STORAGE_KEY = "tunas:auth-session:v2";
const LEGACY_STORAGE_KEYS = ["tunas:auth-session:v1", "hijau-ai:auth-session:v1"];
export const AUTH_SESSION_CHANGE_EVENT = "tunas:auth-session-change";

function notifyAuthSessionChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

function browserStorage(): SessionStorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function string(value: unknown): value is string {
  return typeof value === "string";
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!object(value) || value.version !== 2 || !string(value.accessToken) || typeof value.expiresAt !== "number" || typeof value.hasFarm !== "boolean") return false;
  if (!object(value.account) || !string(value.account.id) || !string(value.account.displayName) || !string(value.account.email) || !string(value.account.createdAt)) return false;
  return string(value.sourceLabel);
}

export function isSessionActive(session: AuthSession, now = Date.now()) {
  return session.expiresAt > now;
}

export function readAuthSession(storage: SessionStorageLike | null = browserStorage()): AuthSession | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) storage.removeItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAuthSession(parsed)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    clearAuthSession(storage);
    return null;
  }
}

export function writeAuthSession(session: AuthSession, storage: SessionStorageLike | null = browserStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
    notifyAuthSessionChange();
    return true;
  } catch {
    return false;
  }
}

export function clearAuthSession(storage: SessionStorageLike | null = browserStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) storage.removeItem(key);
    notifyAuthSessionChange();
    return true;
  } catch {
    return false;
  }
}

export function createGoogleAuthSession({
  accessToken,
  expiresInSeconds,
  identity,
  hasFarm,
  now = Date.now(),
}: {
  accessToken: string;
  expiresInSeconds: number;
  identity: GoogleIdentity;
  hasFarm: boolean;
  now?: number;
}): AuthSession {
  const email = identity.email ?? "Google account";
  const displayName = identity.displayName?.trim() || email.split("@")[0] || "Farmer";
  return {
    version: 2,
    accessToken,
    expiresAt: now + (expiresInSeconds * 1000),
    hasFarm,
    account: { id: identity.userId, displayName, email, createdAt: new Date(now).toISOString() },
    sourceLabel: "Google sign-in",
  };
}

export function parseGoogleCallback(fragment: string) {
  const parameters = new URLSearchParams(fragment.replace(/^#/, ""));
  const providerError = parameters.get("error_description") ?? parameters.get("error");
  if (providerError) throw new Error(providerError);

  const accessToken = parameters.get("access_token");
  const expiresInSeconds = Number(parameters.get("expires_in"));
  if (!accessToken || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error("Google sign-in did not return a valid session. Please try again.");
  }
  return { accessToken, expiresInSeconds };
}

function responseIdentity(value: unknown): GoogleIdentity {
  if (!object(value) || !string(value.userId)) throw new Error("The sign-in session could not be verified.");
  return {
    userId: value.userId,
    email: string(value.email) ? value.email : null,
    displayName: string(value.displayName) ? value.displayName : null,
  };
}

export async function completeGoogleCallback(fragment: string, request: AuthRequest, now = Date.now()): Promise<AuthSession> {
  const { accessToken, expiresInSeconds } = parseGoogleCallback(fragment);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const sessionResponse = await request("/api/session", { headers });
  if (!sessionResponse.ok) throw new Error("The sign-in session could not be verified. Please try again.");

  const farmResponse = await request("/api/farm", { headers });
  if (!farmResponse.ok && farmResponse.status !== 404) throw new Error("We could not check your farm setup. Please try again.");
  return createGoogleAuthSession({
    accessToken,
    expiresInSeconds,
    identity: responseIdentity(await sessionResponse.json()),
    hasFarm: farmResponse.status !== 404,
    now,
  });
}

export async function refreshGoogleAuthSession(session: AuthSession, request: AuthRequest): Promise<AuthSession> {
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const sessionResponse = await request("/api/session", { headers });
  if (!sessionResponse.ok) throw new Error("The sign-in session could not be verified. Please sign in again.");

  const farmResponse = await request("/api/farm", { headers });
  if (!farmResponse.ok && farmResponse.status !== 404) throw new Error("We could not check your farm setup. Please try again.");
  const identity = responseIdentity(await sessionResponse.json());
  const hasFarm = farmResponse.status !== 404;
  return {
    ...session,
    hasFarm,
    account: {
      ...session.account,
      id: identity.userId,
      email: identity.email ?? "Google account",
      displayName: identity.displayName?.trim() || identity.email?.split("@")[0] || "Farmer",
    },
  };
}

export function getPostAuthenticationPath(session: Pick<AuthSession, "hasFarm">) {
  return session.hasFarm ? "/today" : "/onboarding";
}
