import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_CALENDAR_DATA } from "../src/api/calendar/mockSupport/demoCalendarData.ts";
import { getDemoMissionDetail } from "../src/api/missions/mockSupport/demoMissionDetailData.ts";
import { buildMonthGrid, shiftMonth } from "../src/features/calendar/calendarUtils.ts";

test("Calendar contains only explicitly approved mission-linked events", () => {
  assert.ok(DEMO_CALENDAR_DATA.events.length > 0);
  for (const event of DEMO_CALENDAR_DATA.events) {
    assert.equal(event.approvalStatus, "approved");
    assert.ok(event.missionId);
    assert.ok(event.approvalLabel);
    assert.equal(getDemoMissionDetail(event.missionId)?.id, event.missionId);
  }
});

test("Calendar fixture IDs are unique and events are chronologically ordered", () => {
  const { events } = DEMO_CALENDAR_DATA;
  assert.equal(new Set(events.map((event) => event.id)).size, events.length);
  const timestamps = events.map((event) => `${event.date}T${event.startTime}`);
  assert.deepEqual(timestamps, [...timestamps].sort());
});

test("Calendar fixture remains a simulated read-only source", () => {
  assert.match(DEMO_CALENDAR_DATA.sourceLabel, /Simulated Calendar/);
  assert.match(DEMO_CALENDAR_DATA.freshness, /No external calendar connection/);
});

test("Calendar builds a complete Monday-first month grid around approved events", () => {
  const days = buildMonthGrid(DEMO_CALENDAR_DATA.initialMonth, DEMO_CALENDAR_DATA.referenceDate, DEMO_CALENDAR_DATA.events);
  assert.equal(days.length % 7, 0);
  assert.equal(days.length, 35);
  assert.equal(days[0]?.date, "2026-06-29");
  assert.equal(days.at(-1)?.date, "2026-08-02");
  assert.equal(days.find((day) => day.date === "2026-07-14")?.events.length, 3);
  assert.equal(days.find((day) => day.date === "2026-07-14")?.isReferenceDate, true);
  assert.equal(shiftMonth("2026-07", -1), "2026-06");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
});
