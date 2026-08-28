import assert from "node:assert/strict";
import test from "node:test";
import { actOnTunasMessage, checkTunasForecast, createTunasTestAlert, getTunasMessages, markTunasRead } from "../src/api/tunas/index.ts";

test("uses the persisted Tunas alert endpoints", async () => {
  const originalFetch = globalThis.fetch; const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ messages: [], unreadCount: 0, navigation: null }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try { await getTunasMessages(); await checkTunasForecast(); await markTunasRead(); await createTunasTestAlert("drying-rain"); await actOnTunasMessage("message-1", "keep"); }
  finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/tunas/messages", undefined], ["/api/tunas/daily-check", "POST"], ["/api/tunas/messages/read", "POST"], ["/api/tunas/test-alerts/drying-rain", "POST"], ["/api/tunas/actions/message-1", "POST"]]);
  assert.deepEqual(JSON.parse(String(requests[4].init?.body)), { action: "keep" });
});

test("surfaces the active-mission prerequisite for a Tunas demo", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Create and approve an active mission before using this Tunas demo." }), { status: 409, headers: { "Content-Type": "application/json" } });
  try { await assert.rejects(createTunasTestAlert("harvest-rain"), /Create and approve an active mission/); }
  finally { globalThis.fetch = originalFetch; }
});
