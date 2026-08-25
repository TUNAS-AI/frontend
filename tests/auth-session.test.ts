import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_SESSION_CHANGE_EVENT,
  clearAuthSession,
  createGoogleAuthSession,
  isSessionActive,
  readAuthSession,
  writeAuthSession,
} from "../src/features/auth/authSession.ts";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("stores a verified Google session with its farm state", () => {
  const session = createGoogleAuthSession({
    accessToken: "access-token",
    expiresInSeconds: 3600,
    identity: { userId: "user-1", email: "sari@example.com", displayName: "Sari Tani" },
    hasFarm: false,
    now: 1000,
  });

  assert.equal(session.hasFarm, false);
  assert.equal(session.account.email, "sari@example.com");
  assert.equal(isSessionActive(session, 1000 + 3_599_000), true);
  assert.equal(isSessionActive(session, 1000 + 3_600_000), false);
});

test("round-trips and clears the session-scoped Google bearer token", () => {
  const storage = createStorage();
  const session = createGoogleAuthSession({
    accessToken: "access-token",
    expiresInSeconds: 3600,
    identity: { userId: "user-1", email: null, displayName: null },
    hasFarm: true,
    now: 1000,
  });

  assert.equal(writeAuthSession(session, storage), true);
  assert.deepEqual(readAuthSession(storage), session);
  assert.equal(clearAuthSession(storage), true);
  assert.equal(readAuthSession(storage), null);
});

test("discards the legacy demo session instead of treating it as authentication", () => {
  const storage = createStorage();
  storage.setItem("hijau-ai:auth-session:v1", JSON.stringify({ version: 1 }));

  assert.equal(readAuthSession(storage), null);
  assert.equal(storage.getItem("hijau-ai:auth-session:v1"), null);
});

test("browser session writes and clears notify the app session provider", () => {
  const storage = createStorage();
  const events = new EventTarget();
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: storage,
      dispatchEvent: events.dispatchEvent.bind(events),
    },
  });

  try {
    let changes = 0;
    events.addEventListener(AUTH_SESSION_CHANGE_EVENT, () => { changes += 1; });
    assert.equal(writeAuthSession(createGoogleAuthSession({
      accessToken: "access-token",
      expiresInSeconds: 3600,
      identity: { userId: "user-1", email: null, displayName: null },
      hasFarm: false,
    })), true);
    assert.equal(clearAuthSession(), true);
    assert.equal(changes, 2);
  } finally {
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
