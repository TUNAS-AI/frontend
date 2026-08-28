import assert from "node:assert/strict";
import test from "node:test";
import { advanceMissionStage, completeMissionStep, confirmMissionCloseout, confirmMissionPreview, deleteMission, getMission, getMissions, interpretMissionPreview, planMissionPreview, saveMissionCloseout } from "../src/api/missions/index.ts";

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

test("sends the mission preview and confirmation flow to the backend", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify({ missionId: "mission-1", plans: [], previewToken: "token", expiresInSeconds: 1800 }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    await interpretMissionPreview({ message: "Harvest shallots" });
    await planMissionPreview({ previewId: "preview-1", messages: [{ role: "farmer", content: "Harvest shallots" }], facts: { fieldBlockId: null, cropBatchIds: [], buyerCommitmentId: null, buyerQuantityKg: null, marketQuality: null, plannedHarvestKg: null, plannedDriedKg: null, deadline: null, availableWorkerCount: null, coveredDryingCapacityKg: null, notes: null, clarification: null }, review: [], blocks: [] });
    await confirmMissionPreview("token", "plan-1");
    await deleteMission("mission-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/mission-previews/interpret", "POST"], ["/api/mission-previews/plan", "POST"], ["/api/missions", "POST"], ["/api/missions/mission-1", "DELETE"]]);
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { message: "Harvest shallots" });
  assert.deepEqual(JSON.parse(String(requests[2].init?.body)), { previewToken: "token", planId: "plan-1" });
});

test("sends execution and closeout changes to the mission backend", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ missionId: "mission-1" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try {
    await advanceMissionStage("mission-1", "HARVESTING");
    await completeMissionStep("mission-1", "step-1");
    await saveMissionCloseout("mission-1", { actualHarvestKg: 80, actualDriedKg: 70, harvestedAreaHectares: null, buyerTargetMet: true, dryingCompleted: true, rejectedKg: 2, notes: "Rain delayed drying." });
    await confirmMissionCloseout("mission-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/missions/mission-1/stage", "POST"], ["/api/missions/mission-1/steps/step-1/status", "POST"], ["/api/missions/mission-1/closeout", "POST"], ["/api/missions/mission-1/closeout/confirm", "POST"]]);
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { status: "COMPLETED" });
  assert.deepEqual(JSON.parse(String(requests[2].init?.body)), { actualHarvestKg: 80, actualDriedKg: 70, harvestedAreaHectares: null, buyerTargetMet: true, dryingCompleted: true, rejectedKg: 2, notes: "Rain delayed drying." });
});
