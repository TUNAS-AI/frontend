import assert from "node:assert/strict";
import test from "node:test";
import { MockMissionService } from "../src/api/missions/mockSupport/MockMissionService.ts";
import { DEMO_LONG_TERM_SCHEDULE, REFERENCE_INPUT } from "../src/api/missions/mockSupport/demoMissionData.ts";
import { createPlans, INITIAL_PLAN_REVISION_ID, isRevisionStale, isSupportedAdjustment, REQUIRED_ADJUSTMENT } from "../src/api/missions/missionWorkflow.ts";
import { clearMissionDraft, persistMissionDraft, restoreMissionDraft, type DraftStorage } from "../src/features/missions/missionDraftStorage.ts";
import { getMissionScheduleSummary, getNextActivitySummary } from "../src/features/missions/missionSchedule.ts";
import type { MissionDraftSnapshot } from "../src/features/missions/types.ts";

async function interpreted(service: MockMissionService, missionId: string) {
  return service.interpret({ missionId, message: REFERENCE_INPUT, scenario: "normal" });
}

test("distinct drafts receive unique stable mission IDs", async () => {
  const service = new MockMissionService();
  const first = await service.createDraft();
  const second = await service.createDraft();
  assert.notEqual(first.missionId, second.missionId);
});

test("corrected buyer quantity and harvest amount affect planning", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const original = await interpreted(service, missionId);
  const facts = original.facts.map((fact) => fact.key === "buyerQuantity"
    ? { ...fact, value: "60 kg", provenance: "farmer-reported" as const } : fact);
  const checked = await service.checkpoint({ ...original, facts });
  const result = await service.plan({ checkpoint: checked.checkpoint, harvestAmountKg: 60, interpretation: checked.interpretation });

  assert.equal(result.plans[0].fulfilment.target, 60);
  assert.equal(result.plans[0].feasibility.selectable, true);
  assert.match(result.constraintSummary, /60 kg/);
});

test("empty corrected required facts are rejected and low harvest amount returns no valid plan", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const interpretation = await interpreted(service, missionId);
  const emptyMaturity = { ...interpretation, facts: interpretation.facts.map((fact) => fact.key === "maturity" ? { ...fact, value: "", provenance: "missing" as const } : fact) };
  await assert.rejects(service.checkpoint(emptyMaturity), /Maturity is required/);
  const unsupportedDeadline = { ...interpretation, facts: interpretation.facts.map((fact) => fact.key === "deadline" ? { ...fact, value: "2026-07-14 16:00" } : fact) };
  await assert.rejects(service.checkpoint(unsupportedDeadline), /deterministic deadline/);

  const checked = await service.checkpoint(interpretation);
  const result = await service.plan({ checkpoint: checked.checkpoint, harvestAmountKg: 6, interpretation: checked.interpretation });
  assert.equal(result.plans.length, 0);
  assert.match(result.constraintSummary, /6 kg is below/);
});

test("bounded parser rejects unrelated input and keeps unsupported material facts read-only", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  await assert.rejects(service.interpret({ missionId, message: "Please schedule fertilizer next week.", scenario: "normal" }), /East Block chili harvest requests/);
  const interpretation = await interpreted(service, missionId);
  for (const key of ["fieldBlock", "cropBatch", "maturity", "grade", "deadline", "weatherDependency", "objective", "constraints"]) {
    assert.equal(interpretation.facts.find((fact) => fact.key === key)?.editable, false);
  }
  const mixed = await service.interpret({
    missionId,
    message: "Chili East Block is red. Buyer needs 65 kg Grade A tomorrow and rain is expected.",
    scenario: "normal",
  });
  assert.equal(mixed.facts.find((fact) => fact.key === "buyerQuantity")?.value, "65 kg");
});

test("buyer corrections normalize strictly once at checkpoint", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const interpretation = await interpreted(service, missionId);
  const corrected = { ...interpretation, facts: interpretation.facts.map((fact) => fact.key === "buyerQuantity" ? { ...fact, value: "80.5 kg" } : fact) };
  const checked = await service.checkpoint(corrected);
  assert.deepEqual(checked.checkpoint.normalized, { buyerQuantityKg: 80.5 });
  const malformedBuyer = { ...interpretation, facts: interpretation.facts.map((fact) => fact.key === "buyerQuantity" ? { ...fact, value: "80 kg approximately" } : fact) };
  await assert.rejects(service.checkpoint(malformedBuyer), /valid positive number/);
});

test("initial recommendation is feasible and every valid harvest plan has a bounded daily window", () => {
  const result = createPlans("initial", { harvestAmountKg: 80, buyerTarget: 80 });
  const recommendation = result.plans.find((plan) => plan.recommended);
  assert.equal(recommendation?.feasibility.selectable, true);
  for (const plan of result.plans.filter((item) => item.feasibility.selectable)) {
    assert.equal(plan.schedule.type, "daily-window");
    if (plan.schedule.type === "daily-window") assert.ok(plan.schedule.endTime <= "10:00");
  }
});

test("an initial selected plan can be previewed without recalculation", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const selectedPlan = createPlans("initial").plans.find((plan) => plan.recommended);
  assert.ok(selectedPlan);

  const preview = await service.preview({ missionId, revisionId: INITIAL_PLAN_REVISION_ID, plan: selectedPlan });
  assert.equal(preview.revisionId, INITIAL_PLAN_REVISION_ID);
  assert.equal(preview.planId, selectedPlan.id);
});

test("schedule summaries adapt from daily work to a multi-week growing plan", () => {
  const daily = createPlans("initial").plans[0].schedule;
  assert.deepEqual(getMissionScheduleSummary(daily), {
    label: "Working window",
    value: "06:30-10:00",
    detail: "Planned start to finish",
  });

  assert.deepEqual(getMissionScheduleSummary(DEMO_LONG_TERM_SCHEDULE), {
    label: "Plan duration",
    value: "8 weeks",
    detail: "15 Jul 2026 - 15 Sept 2026",
  });
  assert.equal(getNextActivitySummary(DEMO_LONG_TERM_SCHEDULE), "Apply starter fertilizer · 18 Jul 2026 · 07:00-08:30");
});

test("market-quality quantity determines exact buyer fulfilment percentages and deadline risk", () => {
  const plans = createPlans("initial", { harvestAmountKg: 80, buyerTarget: 80 }).plans;
  assert.deepEqual(plans.map((plan) => [plan.id, plan.fulfilment.minPercent, plan.fulfilment.maxPercent, plan.deadlineRisk]), [
    ["early-full", 75, 88, "high"],
    ["selective-partial", 68, 80, "high"],
    ["split-harvest", 80, 93, "high"],
  ]);
});

test("harvest amount boundaries return explicit validity and blockers", () => {
  const six = createPlans("initial", { harvestAmountKg: 6 });
  const forty = createPlans("initial", { harvestAmountKg: 40 });
  const fifty = createPlans("initial", { harvestAmountKg: 50 });
  assert.equal(six.hasValidPlan, false);
  assert.equal(six.plans.length, 0);
  assert.equal(forty.hasValidPlan, false);
  assert.equal(fifty.hasValidPlan, true);
});

test("only the supported adjustment intent recalculates and changed text makes the revision stale", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const plans = createPlans("initial").plans;
  await assert.rejects(service.recalculate({ missionId, plans, adjustment: "Harvest faster" }), /supports only/);
  assert.equal(isSupportedAdjustment("PRIORITIZE the buyer order but do not use overtime"), true);
  const adjusted = await service.recalculate({ missionId, plans, adjustment: REQUIRED_ADJUSTMENT });
  assert.equal(adjusted.result.plans.find((plan) => plan.recommended)?.id, "early-full");
  assert.equal(isRevisionStale(REQUIRED_ADJUSTMENT, `${REQUIRED_ADJUSTMENT} changed`), true);
  assert.equal(isRevisionStale(REQUIRED_ADJUSTMENT, REQUIRED_ADJUSTMENT), false);
});

test("each plan variant produces a distinct exact preview and submit returns it unchanged", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const plans = createPlans("adjusted").plans;
  const eventSignatures = new Set<string>();
  for (const plan of plans) {
    const preview = await service.preview({ missionId, revisionId: "revision-plan-variants", plan });
    const result = await service.submit({ preview, scenario: "normal" });
    assert.equal(preview.planName, plan.name);
    assert.equal(preview.date, "2026-07-13");
    assert.equal(preview.timezone, "Asia/Jakarta");
    assert.deepEqual(result.events, preview.events);
    assert.deepEqual(result.steps, preview.steps);
    eventSignatures.add(preview.events.map((event) => `${event.title}:${event.startTime}:${event.endTime}:${event.conditional}`).join("|"));
  }
  assert.equal(eventSignatures.size, 3);
});

test("approval previews contain exact strategy-specific mission steps", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  const plans = createPlans("adjusted").plans;
  const steps = new Map<string, string[]>();
  for (const plan of plans) {
    const preview = await service.preview({ missionId, revisionId: "revision-steps", plan });
    steps.set(plan.id, preview.steps.map((step) => step.name));
  }
  assert.deepEqual(steps.get("early-full"), ["Inspect maturity", "Prepare harvest handling", "Harvest East Block", "Transfer produce to cover", "Sort", "Pack", "Buyer collection"]);
  assert.deepEqual(steps.get("selective-partial"), ["Inspect maturity", "Prepare harvest handling", "Harvest East Block", "Reassess quantity", "Transfer produce to cover", "Sort", "Pack", "Buyer collection"]);
  assert.deepEqual(steps.get("split-harvest"), ["Inspect maturity", "Prepare harvest handling", "Harvest East Block", "Reassess quantity", "Conditional West Block harvest", "Transfer produce to cover", "Sort", "Pack", "Buyer collection"]);
  assert.equal(steps.get("early-full")?.includes("Conditional West Block harvest"), false);
  assert.equal(steps.get("selective-partial")?.includes("Conditional West Block harvest"), false);
});

test("service submission is duplicate-safe but distinct missions and revisions do not collide", async () => {
  const service = new MockMissionService();
  const firstDraft = await service.createDraft();
  const secondDraft = await service.createDraft();
  const plan = createPlans("adjusted").plans[0];
  const firstPreview = await service.preview({ missionId: firstDraft.missionId, revisionId: "revision-1", plan });
  const repeated = await service.submit({ preview: firstPreview, scenario: "normal" });
  const duplicate = await service.submit({ preview: firstPreview, scenario: "normal" });
  const newRevision = await service.preview({ missionId: firstDraft.missionId, revisionId: "revision-2", plan });
  const otherDraft = await service.preview({ missionId: secondDraft.missionId, revisionId: "revision-1", plan });

  assert.equal(repeated.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal((await service.submit({ preview: newRevision, scenario: "normal" })).duplicate, false);
  assert.equal((await service.submit({ preview: otherDraft, scenario: "normal" })).duplicate, false);
  assert.notEqual(firstPreview.approvalKey, newRevision.approvalKey);
  assert.notEqual(firstPreview.approvalKey, otherDraft.approvalKey);
});

test("submission idempotency survives a new service instance when session storage is available", async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
  try {
    const firstService = new MockMissionService();
    const { missionId } = await firstService.createDraft();
    const preview = await firstService.preview({ missionId, revisionId: "revision-refresh", plan: createPlans("adjusted").plans[0] });
    assert.equal((await firstService.submit({ preview, scenario: "normal" })).duplicate, false);
    const restoredService = new MockMissionService();
    assert.equal((await restoredService.submit({ preview, scenario: "normal" })).duplicate, true);
  } finally {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("interpretation and consequential submission failures are deterministic and recoverable", async () => {
  const service = new MockMissionService();
  const { missionId } = await service.createDraft();
  await assert.rejects(service.interpret({ missionId, message: REFERENCE_INPUT, scenario: "interpret-failure" }), /original request is still saved/);
  const plan = createPlans("adjusted").plans[0];
  const preview = await service.preview({ missionId, revisionId: "revision-failure", plan });
  await assert.rejects(service.submit({ preview, scenario: "submit-failure" }), /preview remains saved/);
  assert.equal((await service.submit({ preview, scenario: "normal" })).duplicate, false);
});

test("draft storage restores a valid current checkpoint and reset removes it", async () => {
  const values = new Map<string, string>();
  const storage: DraftStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
  const service = new MockMissionService();
  const interpretation = await interpreted(service, "mission-persisted");
  const checked = await service.checkpoint(interpretation);
  const snapshot: MissionDraftSnapshot = {
    version: 2,
    missionId: "mission-persisted",
    message: REFERENCE_INPUT,
    stage: "checkpoint",
    interpretation: checked.interpretation,
    checkpoint: checked.checkpoint,
    harvestAmount: "72",
    plans: [],
    initialPlans: [],
    adjustment: REQUIRED_ADJUSTMENT,
    appliedAdjustment: "",
    adjusted: false,
    revisionId: null,
    selectedPlanId: null,
    preview: null,
    createdMission: null,
  };
  assert.equal(persistMissionDraft(snapshot, storage), true);
  assert.deepEqual(restoreMissionDraft(storage), snapshot);

  const longRangePlan = {
    ...createPlans("initial").plans[0],
    schedule: DEMO_LONG_TERM_SCHEDULE,
  };
  const longRangeSnapshot: MissionDraftSnapshot = { ...snapshot, plans: [longRangePlan], initialPlans: [longRangePlan] };
  assert.equal(persistMissionDraft(longRangeSnapshot, storage), true);
  assert.deepEqual(restoreMissionDraft(storage), longRangeSnapshot);
  assert.equal(clearMissionDraft(storage), true);
  assert.equal(restoreMissionDraft(storage), null);

  const dailyPlan = createPlans("initial").plans[0];
  assert.equal(dailyPlan.schedule.type, "daily-window");
  if (dailyPlan.schedule.type !== "daily-window") throw new Error("Expected the harvest fixture to use a daily window.");
  const { schedule, ...legacyPlan } = dailyPlan;
  const legacySnapshot = {
    ...snapshot,
    version: 1,
    plans: [{ ...legacyPlan, timing: { start: schedule.startTime, end: schedule.endTime } }],
    initialPlans: [{ ...legacyPlan, timing: { start: schedule.startTime, end: schedule.endTime } }],
  };
  values.set("hijau-ai:mission-draft:v1", JSON.stringify(legacySnapshot));
  const migratedSnapshot: MissionDraftSnapshot = { ...snapshot, plans: [dailyPlan], initialPlans: [dailyPlan] };
  assert.deepEqual(restoreMissionDraft(storage), migratedSnapshot);
  assert.equal(values.has("hijau-ai:mission-draft:v1"), false);
  assert.equal(values.has("tunas:mission-draft:v2"), true);
  assert.equal(clearMissionDraft(storage), true);
  assert.equal(persistMissionDraft(snapshot, null), false);
  assert.equal(restoreMissionDraft(null), null);
  assert.equal(clearMissionDraft(null), false);
});

test("draft storage clears malformed, incompatible, and invalid current-version snapshots", () => {
  const values = new Map<string, string>();
  const storage: DraftStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
  const key = "tunas:mission-draft:v2";
  values.set(key, "{malformed");
  assert.equal(restoreMissionDraft(storage), null);
  assert.equal(values.has(key), false);
  values.set(key, JSON.stringify({ version: 2, missionId: "old" }));
  assert.equal(restoreMissionDraft(storage), null);
  assert.equal(values.has(key), false);
  values.set(key, JSON.stringify({ version: 2, missionId: "current", message: "x", stage: "checkpoint" }));
  assert.equal(restoreMissionDraft(storage), null);
  assert.equal(values.has(key), false);
});
