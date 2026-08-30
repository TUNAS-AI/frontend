import assert from "node:assert/strict";
import test from "node:test";
import { advanceMissionStage, completeMissionStep, confirmMissionCloseout, confirmMissionPreview, confirmMissionReplan, deleteMission, getMission, getMissionReplanDraft, getMissions, interpretMissionPreview, interpretMissionReplan, isStaleMissionApproval, MissionApiError, planMissionPreview, planMissionReplan, saveMissionCloseout } from "../src/api/missions/index.ts";

test("loads the caller's mission list and an individual mission from the backend", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return new Response(JSON.stringify(input.toString().endsWith("/mission-1") ? { missionId: "mission-1" } : [{ missionId: "mission-1" }]), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    assert.equal((await getMissions())[0].missionId, "mission-1");
    assert.equal((await getMission("mission-1")).missionId, "mission-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((url) => new URL(url).pathname), ["/api/missions", "/api/missions/mission-1"]);
});

test("surfaces an actionable mission backend error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Mission not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  try {
    await assert.rejects(getMission("missing"), /Mission not found/);
  } finally { globalThis.fetch = originalFetch; }
});

test("preserves structured mission error status and code", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Preview expired", code: "PREVIEW_EXPIRED" }), { status: 409, headers: { "Content-Type": "application/json" } });
  try {
    await assert.rejects(confirmMissionPreview("expired", "plan-1"), (error: unknown) => {
      assert.ok(error instanceof MissionApiError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "PREVIEW_EXPIRED");
      assert.equal(isStaleMissionApproval(error), true);
      return true;
    });
  } finally { globalThis.fetch = originalFetch; }
});

test("returns the discriminated feasible and infeasible planning responses unchanged", async () => {
  const originalFetch = globalThis.fetch;
  const responses = [
    { status: "feasible", missionId: "mission-1", candidates: [], recommendation: null, previewToken: "token", expiresInSeconds: 1800 },
    { status: "infeasible", missionId: "mission-1", blockers: ["Deadline cannot be met safely."] },
  ];
  globalThis.fetch = async () => new Response(JSON.stringify(responses.shift()), { status: 200, headers: { "Content-Type": "application/json" } });
  const candidate = { previewId: "preview-1", messages: [], facts: { fieldBlockId: null, cropBatchIds: [], marketQuality: null, plannedHarvestKg: null, plannedDriedKg: null, deadline: null, availableWorkerCount: null, coveredDryingCapacityKg: null, notes: null, clarification: null }, review: [], blocks: [] };
  try {
    const feasible = await planMissionPreview(candidate);
    assert.equal(feasible.status, "feasible");
    if (feasible.status === "feasible") assert.deepEqual(feasible.candidates, []);
    const infeasible = await planMissionPreview(candidate);
    assert.equal(infeasible.status, "infeasible");
    if (infeasible.status === "infeasible") assert.deepEqual(infeasible.blockers, ["Deadline cannot be met safely."]);
  } finally { globalThis.fetch = originalFetch; }
});

test("sends the mission preview and confirmation flow to the backend", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify({ missionId: "mission-1", plans: [], previewToken: "token", expiresInSeconds: 1800 }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    await interpretMissionPreview({ message: "Harvest shallots" });
    await planMissionPreview({ previewId: "preview-1", messages: [{ role: "farmer", content: "Harvest shallots" }], facts: { fieldBlockId: null, cropBatchIds: [], marketQuality: null, plannedHarvestKg: null, plannedDriedKg: null, deadline: null, availableWorkerCount: null, coveredDryingCapacityKg: null, notes: null, clarification: null }, review: [], blocks: [] });
    await confirmMissionPreview("token", "plan-1");
    await deleteMission("mission-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/mission-previews/interpret", "POST"], ["/api/mission-previews/plan", "POST"], ["/api/missions", "POST"], ["/api/missions/mission-1", "DELETE"]]);
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { message: "Harvest shallots" });
  assert.deepEqual(JSON.parse(String(requests[2].init?.body)), { previewToken: "token", planId: "plan-1" });
});

test("preserves scheduling v2 facts in the planning request", async () => {
  const originalFetch = globalThis.fetch;
  let body: unknown;
  globalThis.fetch = async (_input, init) => { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ status: "infeasible", missionId: "mission-1", blockers: [] }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  const facts = { fieldBlockId: null, cropBatchIds: [], marketQuality: null, plannedHarvestKg: 100, plannedDriedKg: 80, deadline: null, harvestWindowStart: "2026-08-30T06:00:00+07:00", harvestWindowEnd: "2026-08-30T10:00:00+07:00", buyerPickupAt: "2026-09-02T15:30:00+07:00", priority: "LOWEST_RAIN_RISK" as const, partialFulfillmentAllowed: false, harvestDurationHours: 4, estimatedHarvestableKg: 100, rainProtectionAvailable: true, availableWorkerCount: 5, coveredDryingCapacityKg: 100, notes: null, clarification: null };
  try { await planMissionPreview({ previewId: "preview-1", messages: [{ role: "farmer", content: "Panen penuh sebelum penjemputan." }], facts, review: [], blocks: [] }); } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual((body as { candidate: { facts: typeof facts } }).candidate.facts, facts);
});

test("sends execution and closeout changes to the mission backend", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ missionId: "mission-1" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try {
    await advanceMissionStage("mission-1", "HARVESTING");
    await completeMissionStep("mission-1", "step-1");
    await saveMissionCloseout("mission-1", { actualHarvestKg: 80, actualDriedKg: 70, harvestedAreaHectares: null, dryingCompleted: true, rejectedKg: 2, notes: "Rain delayed drying." });
    await confirmMissionCloseout("mission-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/missions/mission-1/stage", "POST"], ["/api/missions/mission-1/steps/step-1/status", "POST"], ["/api/missions/mission-1/closeout", "POST"], ["/api/missions/mission-1/closeout/confirm", "POST"]]);
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { status: "COMPLETED" });
  assert.deepEqual(JSON.parse(String(requests[2].init?.body)), { actualHarvestKg: 80, actualDriedKg: 70, harvestedAreaHectares: null, dryingCompleted: true, rejectedKg: 2, notes: "Rain delayed drying." });
});

test("loads and confirms a mission replacement plan", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ previewId: "preview-1", plans: [], previewToken: "token", expiresInSeconds: 1800 }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  const candidate = { previewId: "preview-1", messages: [{ role: "farmer" as const, content: "Rain changed the plan" }], facts: { fieldBlockId: null, cropBatchIds: [], marketQuality: null, plannedHarvestKg: null, plannedDriedKg: null, deadline: null, availableWorkerCount: null, coveredDryingCapacityKg: null, notes: null, clarification: null }, review: [], blocks: [] };
  try {
    await getMissionReplanDraft("mission-1");
    await interpretMissionReplan("mission-1", { message: "Rain changed the plan" });
    await planMissionReplan("mission-1", candidate);
  await confirmMissionReplan("mission-1", "token", "plan-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/missions/mission-1/replan", undefined], ["/api/missions/mission-1/replan/interpret", "POST"], ["/api/missions/mission-1/replan/plan", "POST"], ["/api/missions/mission-1/replan/confirm", "POST"]]);
  assert.deepEqual(JSON.parse(String(requests[3].init?.body)), { previewToken: "token", planId: "plan-1" });
});
