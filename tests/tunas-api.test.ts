import assert from "node:assert/strict";
import test from "node:test";
import { actOnTunasMessage, approveTunasPendingAction, checkTunasForecast, createTunasTestAlert, getTunasInteractions, getTunasMessages, getTunasMissionReports, getTunasMissionTimeline, markTunasRead, rejectTunasPendingAction, sendTunasInteraction, sendTunasReport } from "../src/api/tunas/index.ts";

test("uses the persisted Tunas alert endpoints", async () => {
  const originalFetch = globalThis.fetch; const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ messages: [], unreadCount: 0, navigation: null }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try { await getTunasMessages(); await checkTunasForecast(); await markTunasRead(); await createTunasTestAlert("mission-1", "drying-rain"); await actOnTunasMessage("message-1", "keep"); }
  finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/tunas/messages", undefined], ["/api/tunas/daily-check", "POST"], ["/api/tunas/messages/read", "POST"], ["/api/tunas/test-alerts/drying-rain", "POST"], ["/api/tunas/actions/message-1", "POST"]]);
  assert.deepEqual(JSON.parse(String(requests[3].init?.body)), { missionId: "mission-1" });
  assert.deepEqual(JSON.parse(String(requests[4].init?.body)), { action: "keep" });
});

test("uses the operational interaction and timeline endpoints", async () => {
  const originalFetch = globalThis.fetch; const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ interactions: [], events: [], pendingAction: null }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try { await getTunasInteractions(); await sendTunasInteraction("Move harvest", "submission-1", "mission-1"); await approveTunasPendingAction("pending/1"); await rejectTunasPendingAction("pending/1"); await getTunasMissionTimeline("mission/1"); await getTunasMissionReports("mission/1"); }
  finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/tunas/interactions", undefined], ["/api/tunas/interactions", "POST"], ["/api/tunas/pending/pending%2F1/approve", "POST"], ["/api/tunas/pending/pending%2F1/reject", "POST"], ["/api/tunas/missions/mission%2F1/timeline", undefined], ["/api/tunas/missions/mission%2F1/reports", undefined]]);
  assert.equal(new Headers(requests[1].init?.headers).get("Idempotency-Key"), "submission-1");
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { message: "Move harvest", missionId: "mission-1", channel: "web", externalMessageId: "submission-1" });
});

test("sends structured operational reports with mission scope and idempotency", async () => {
  const originalFetch = globalThis.fetch; let request: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => { request = { url: String(input), init }; return new Response(JSON.stringify({ pendingAction: null }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try { await sendTunasReport("mission-1", { reportType: "WORKER_AVAILABILITY_CHANGED", observedAt: "2026-08-27T10:00:00.000Z", payload: { availableWorkers: 7, effectiveAt: "2026-08-28T00:00:00.000Z" } }, "report-1"); }
  finally { globalThis.fetch = originalFetch; }
  assert.ok(request);
  assert.equal(new URL(request.url).pathname, "/api/tunas/interactions");
  assert.equal(new Headers(request.init?.headers).get("Idempotency-Key"), "report-1");
  assert.deepEqual(JSON.parse(String(request.init?.body)), { missionId: "mission-1", channel: "web", externalMessageId: "report-1", report: { reportType: "WORKER_AVAILABILITY_CHANGED", observedAt: "2026-08-27T10:00:00.000Z", payload: { availableWorkers: 7, effectiveAt: "2026-08-28T00:00:00.000Z" } } });
});

test("surfaces the active-mission prerequisite for a Tunas demo", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Create and approve an active mission before using this Tunas demo." }), { status: 409, headers: { "Content-Type": "application/json" } });
  try { await assert.rejects(createTunasTestAlert("mission-1", "harvest-rain"), /Create and approve an active mission/); }
  finally { globalThis.fetch = originalFetch; }
});
