import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_MISSION_DETAILS, getDemoMissionDetail } from "../src/api/missions/mockSupport/demoMissionDetailData.ts";
import { DEMO_MISSIONS_LIST_DATA } from "../src/api/missions/mockSupport/demoMissionsListData.ts";
import { deriveScheduledTaskState } from "../src/features/missions/missionExecution.ts";

test("mission list placeholder records have stable unique IDs and supported filters", () => {
  const { filters, missions } = DEMO_MISSIONS_LIST_DATA;
  assert.equal(new Set(missions.map((mission) => mission.id)).size, missions.length);
  const allFilter = filters.find((filter) => filter.id === "all");
  assert.ok(allFilter);
  for (const mission of missions) {
    assert.ok(allFilter.statuses.includes(mission.status));
    assert.ok(mission.context.length > 0);
  }
});

test("mission list exposes only routes implemented by the current slice", () => {
  const interactive = DEMO_MISSIONS_LIST_DATA.missions.filter((mission) => mission.action);
  assert.ok(interactive.length > 0);
  assert.deepEqual(
    new Set(interactive.map((mission) => mission.action?.href)),
    new Set(["/missions/new", "/missions/mission-drainage-recovery", "/outcomes/mission-tomato-market-trial"]),
  );
  assert.ok(DEMO_MISSIONS_LIST_DATA.missions.filter((mission) => !mission.action).every((mission) => mission.unavailableActionLabel));
});

test("mission detail fixtures have a stable execution timeline", () => {
  assert.equal(getDemoMissionDetail("unknown-mission"), null);
  for (const mission of DEMO_MISSION_DETAILS) {
    assert.equal(new Set(mission.steps.map((step) => step.id)).size, mission.steps.length);
    assert.equal(mission.steps.filter((step) => step.status === "in-progress").length, 1);
    assert.ok(mission.context.length > 0);
    assert.ok(mission.closeout.prompt);
    assert.ok(mission.closeout.outcomeHelper);
    assert.equal(getDemoMissionDetail(mission.id)?.id, mission.id);
  }
});

test("elapsed routine mission tasks derive as completed with explicit provenance", () => {
  const mission = DEMO_MISSION_DETAILS[0];
  assert.ok(mission);
  const derived = deriveScheduledTaskState(mission.steps, mission.executionAsOf);
  const assumed = derived.filter((task) => task.completionSource === "assumed-by-time");
  assert.deepEqual(assumed.map((task) => task.id), ["clear-secondary", "recheck-water"]);
  assert.ok(assumed.every((task) => task.status === "completed"));
  assert.equal(derived.find((task) => task.id === "record-condition")?.status, "waiting-confirmation");
});

test("mission list represents the complete placeholder lifecycle", () => {
  assert.deepEqual(
    new Set(DEMO_MISSIONS_LIST_DATA.missions.map((mission) => mission.status)),
    new Set(["draft", "awaiting-clarification", "awaiting-approval", "active", "closed"]),
  );
});

test("reviewable mission cards use one consistent action label", () => {
  const reviewable = DEMO_MISSIONS_LIST_DATA.missions.filter((mission) => mission.status === "awaiting-approval" || mission.status === "closed");
  assert.ok(reviewable.length > 0);
  assert.ok(reviewable.every((mission) => mission.action?.label === "Review mission"));
});
