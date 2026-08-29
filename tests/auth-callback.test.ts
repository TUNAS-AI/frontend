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
      return new Response(JSON.stringify({ userId: "user-1", email: "sari@example.com", displayName: "Sari Tani", hasFarm: false }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  assert.equal(session.hasFarm, false);
  assert.equal(getPostAuthenticationPath(session), "/onboarding");
  assert.deepEqual(requests, [
    { path: "/api/session", authorization: "Bearer token-1" },
  ]);
});

test("routes verified users with a farm to Farm", async () => {
  const session = await completeGoogleCallback("#access_token=token-1&expires_in=3600", async () => {
    return new Response(JSON.stringify({ userId: "user-1", email: null, displayName: null, hasFarm: true }), { status: 200 });
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
  const refreshed = await refreshGoogleAuthSession(current, async () => {
    return new Response(JSON.stringify({ userId: "user-1", email: "sari@example.com", displayName: "Sari Tani", hasFarm: true }), { status: 200 });
  });

  assert.equal(refreshed.hasFarm, true);
  assert.equal(refreshed.account.email, "sari@example.com");
});
