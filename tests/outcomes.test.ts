import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_MISSION_OUTCOMES, getDemoMissionOutcome } from "../src/api/outcomes/mockSupport/demoOutcomesData.ts";
import { getResultsSummary } from "../src/features/outcomes/resultsSummary.ts";

test("mission outcomes have stable IDs and resolve by mission ID", () => {
  assert.equal(new Set(DEMO_MISSION_OUTCOMES.map((outcome) => outcome.id)).size, DEMO_MISSION_OUTCOMES.length);
  assert.equal(new Set(DEMO_MISSION_OUTCOMES.map((outcome) => outcome.missionId)).size, DEMO_MISSION_OUTCOMES.length);
  for (const outcome of DEMO_MISSION_OUTCOMES) assert.equal(getDemoMissionOutcome(outcome.missionId)?.id, outcome.id);
  assert.equal(getDemoMissionOutcome("unknown-mission"), null);
});

test("mission outcome comparisons keep expected, actual, and interpretation together", () => {
  for (const outcome of DEMO_MISSION_OUTCOMES) {
    assert.ok(outcome.comparisons.length > 0);
    assert.ok(outcome.comparisons.every((comparison) => comparison.expected && comparison.actual && comparison.interpretation));
    assert.ok(outcome.evidence.length > 0);
  }
});

test("single-mission evidence does not claim automatic calibration", () => {
  for (const outcome of DEMO_MISSION_OUTCOMES) assert.match(outcome.conclusion, /not enough to calibrate/i);
});

test("overall Results summary withholds benchmarking until enough comparable outcomes exist", () => {
  const summary = getResultsSummary(DEMO_MISSION_OUTCOMES);
  assert.equal(summary.completedMissions, 1);
  assert.equal(summary.fulfilledCommitments, 1);
  assert.equal(summary.withinRangeCount, 2);
  assert.equal(summary.comparisonCount, 4);
  assert.equal(summary.hasBenchmarkEvidence, false);
});
