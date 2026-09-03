import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("candidate review renders every actual activity in Indonesian-localized date groups", async () => {
  const view = await readFile(new URL("../src/features/missions/components/MissionCandidateReview.tsx", import.meta.url), "utf8");
  assert.match(view, /ordered\.map\(\(plan, index\)/);
  assert.match(view, /activities.*sort/);
  assert.match(view, /Intl\.DateTimeFormat\("id-ID"/);
  assert.match(view, /activity\.title/);
  assert.match(view, /activity\.description/);
  assert.match(view, /targetHarvestKg/);
  assert.match(view, /activity\.workers/);
});

test("candidate rationale remains structured and is not appended to the drying reason", async () => {
  const view = await readFile(new URL("../src/features/missions/components/MissionCandidateReview.tsx", import.meta.url), "utf8");
  for (const heading of ["Recommendation reasons", "Deterministic evidence", "Assumptions", "Tradeoffs", "Risks"]) assert.match(view, new RegExp(heading));
  assert.match(view, /No schedule is applied before approval/);
  assert.doesNotMatch(view, /dryingEstimateReason: `|Deterministic evidence: \$\{/);
});

test("candidate tabs select the visible plan without a second selection action", async () => {
  const view = await readFile(new URL("../src/features/missions/components/MissionCandidateReview.tsx", import.meta.url), "utf8");
  for (const behavior of ['role="tablist"', 'role="tab"', 'aria-selected', 'role="tabpanel"', "onSelect\\(plan\\.planId\\)", "Choose a tab to select that plan"]) assert.match(view, new RegExp(behavior));
  assert.match(view, />Approve selected plan</);
  assert.doesNotMatch(view, /Select this plan|Review and approve selected plan/);
});

test("calendar renders timed drying checkpoints without inferring all-day work", async () => {
  const view = await readFile(new URL("../src/features/calendar/CalendarView.tsx", import.meta.url), "utf8");
  assert.match(view, /step\.scheduleType === "DAILY_WINDOW" && step\.windowStart && step\.windowEnd/);
  assert.doesNotMatch(view, /DATE_RANGE/);
  assert.doesNotMatch(view, /"All day"/);
});

test("MVP mission types retain essential facts, actions, and evidence", async () => {
  const api = await readFile(new URL("../src/api/missions/index.ts", import.meta.url), "utf8");
  for (const field of ["readinessConfirmed", "plannedHarvestKg", "deadlineAt", "destination", "actionKind", "evidenceRefs"]) assert.match(api, new RegExp(field));
  for (const action of ["CONFIRM_READINESS_WEATHER", "PREPARE_CREW_TOOLS", "HARVEST", "BUNDLE_COLLECT", "TRANSFER_TO_DRYING", "SET_UP_DRYING", "BEGIN_DRYING", "INSPECT_DRYING", "DEPLOY_RAIN_PROTECTION", "CONFIRM_DRYING_COMPLETE", "CONDITION_GATE"]) assert.match(api, new RegExp(action));
});

test("mission cards prioritize operational facts and safely truncate long plan names", async () => {
  const list = await readFile(new URL("../src/features/missions/MissionsView.tsx", import.meta.url), "utf8");
  for (const detail of ["plannedHarvestKg", "destinationLabel", "deadlineAt", "fieldBlock?.name", "Next work:"]) assert.match(list, new RegExp(detail.replace("?", "\\?")));
  assert.match(list, /approvedPlanName/);
  assert.match(list, /truncate text-xl/);
  assert.doesNotMatch(list, /Harvest and drying work/);
});

test("mission creation uses solid grouped surfaces and collapses technical plan evidence", async () => {
  const creation = await readFile(new URL("../src/features/missions/MissionCreationView.tsx", import.meta.url), "utf8");
  const review = await readFile(new URL("../src/features/missions/components/MissionCandidateReview.tsx", import.meta.url), "utf8");
  for (const group of ["Where", "Outcome", "Confirmation"]) assert.match(creation, new RegExp(`title="${group}"`));
  assert.doesNotMatch(creation, /variant="highlight"/);
  assert.match(review, /Planning details and evidence/);
  assert.match(review, /title=\{plan\.name\}/);
  assert.match(review, /truncate/);
});
