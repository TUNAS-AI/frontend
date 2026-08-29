import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps Calendar navigation in the month card and adapts the daily agenda for mobile", async () => {
  const view = await readFile(new URL("../src/features/calendar/CalendarView.tsx", import.meta.url), "utf8");
  assert.match(view, /GoogleCalendarMark/);
  assert.match(view, /desktopAgenda && Boolean\(agendaDay\)/);
  assert.match(view, /sm:hidden/);
  assert.match(view, /<CalendarAgenda/);
  assert.match(view, /eventsForDate\(steps, selectedDate\)/);
  assert.doesNotMatch(view, /events\.slice\(0, 2\)/);
  assert.doesNotMatch(view, /sm:aspect-\[1\.45\]/);
  assert.doesNotMatch(view, /\+\{overflow\} more/);
  assert.doesNotMatch(view, /<PageHeader[\s\S]*?actions=/);
});
