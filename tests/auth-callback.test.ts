import assert from "node:assert/strict";
import test from "node:test";
import { completeGoogleCallback, createGoogleAuthSession, getPostAuthenticationPath, parseGoogleCallback, refreshGoogleAuthSession } from "../src/features/auth/authSession.ts";

test("parses the Supabase access token and expiry from the OAuth fragment", () => {
  assert.deepEqual(parseGoogleCallback("#access_token=token-1&expires_in=3600"), {
    accessToken: "token-1",
    expiresInSeconds: 3600,
  });
});

test("returns the provider error when OAuth does not return a token", () => {
  assert.throws(
    () => parseGoogleCallback("#error=access_denied&error_description=The%20farmer%20cancelled"),
    /farmer cancelled/i,
  );
});

test("routes verified users without a farm to onboarding", async () => {
  const requests: Array<{ path: string; authorization: string | null }> = [];
  const session = await completeGoogleCallback("#access_token=token-1&expires_in=3600", async (path, options) => {
    requests.push({ path, authorization: new Headers(options?.headers).get("authorization") });
    if (path === "/api/session") {
      return new Response(JSON.stringify({ userId: "user-1", email: "sari@example.com", displayName: "Sari Tani" }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "Farm profile not found" }), { status: 404 });
  });

  assert.equal(session.hasFarm, false);
  assert.equal(getPostAuthenticationPath(session), "/onboarding");
  assert.deepEqual(requests, [
    { path: "/api/session", authorization: "Bearer token-1" },
    { path: "/api/farm", authorization: "Bearer token-1" },
  ]);
});

test("routes verified users with a farm to Farm fields", async () => {
  const session = await completeGoogleCallback("#access_token=token-1&expires_in=3600", async (path) => {
    if (path === "/api/session") {
      return new Response(JSON.stringify({ userId: "user-1", email: null, displayName: null }), { status: 200 });
    }
    return new Response(JSON.stringify({ farmId: "farm-1" }), { status: 200 });
  });

  assert.equal(session.hasFarm, true);
  assert.equal(getPostAuthenticationPath(session), "/farm");
});

test("refreshes a stored session from the backend before protecting routes", async () => {
  const current = createGoogleAuthSession({
    accessToken: "token-1",
    expiresInSeconds: 3600,
    identity: { userId: "user-1", email: "old@example.com", displayName: "Old name" },
    hasFarm: false,
    now: 1000,
  });
  const refreshed = await refreshGoogleAuthSession(current, async (path) => {
    if (path === "/api/session") {
      return new Response(JSON.stringify({ userId: "user-1", email: "sari@example.com", displayName: "Sari Tani" }), { status: 200 });
    }
    return new Response(JSON.stringify({ farmId: "farm-1" }), { status: 200 });
  });

  assert.equal(refreshed.hasFarm, true);
  assert.equal(refreshed.account.email, "sari@example.com");
});
