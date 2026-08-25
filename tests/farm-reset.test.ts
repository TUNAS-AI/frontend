import assert from "node:assert/strict";
import test from "node:test";
import { deleteFarmForOnboardingReset } from "../src/api/farm/reset.ts";

test("deletes the current farm with the required reset confirmation", async () => {
  const originalFetch = globalThis.fetch;
  let request: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = async (input, init) => {
    request = { url: String(input), init };
    return new Response(null, { status: 204 });
  };

  try {
    await deleteFarmForOnboardingReset();
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.ok(request);
  assert.match(request.url, /\/api\/farm$/);
  assert.equal(request.init?.method, "DELETE");
  assert.equal(request.init?.body, JSON.stringify({ confirmation: "DELETE_FARM" }));
});
