import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("mission detail scopes the assistant, hides generic edit, and retains the replan route", async () => {
  const [route, view, routes] = await Promise.all([read("../src/routes/MissionDetailRoute.tsx"), read("../src/features/missions/MissionDetailView.tsx"), read("../src/routes/AppRoutes.tsx")]);
  assert.match(route, /assistantMissionId=\{mission\?\.missionId\}/);
  assert.doesNotMatch(view, />Edit mission</);
  assert.match(routes, /missions\/:missionId\/edit/);
});

test("Farm links Telegram once and mission detail sends a scoped rain demo", async () => {
  const [farm, mission] = await Promise.all([read("../src/features/farm/FarmView.tsx"), read("../src/features/missions/MissionDetailView.tsx")]);
  assert.match(farm, /beginTelegramConnection/);
  assert.match(farm, /Hubungkan Telegram/);
  assert.doesNotMatch(farm, /disconnectTelegram/);
  assert.match(mission, /createTunasTestAlert\(mission\.missionId/);
  assert.match(mission, /Kirim demo peringatan hujan/);
});

test("report dialog supports every report type and contract field", async () => {
  const source = await read("../src/features/missions/OperationalReportDialog.tsx");
  for (const reportType of ["ACTIVITY_STARTED", "ACTIVITY_COMPLETED", "ACTUAL_QUANTITY_REPORTED", "WORKER_AVAILABILITY_CHANGED", "BUYER_REQUIREMENT_CHANGED", "DRYING_RESOURCE_CHANGED", "RAIN_OR_FIELD_EVENT", "MISSION_DEVIATION", "GENERAL_OPERATIONAL_NOTE"]) assert.match(source, new RegExp(reportType));
  for (const field of ["quantityKg", "availableWorkers", "effectiveAt", "targetQuantityKg", "quantityBasis", "deadline", "protectionAvailable", "description", "observedAt", "narrative", "missionStepId"]) assert.match(source, new RegExp(field));
  assert.match(source, /label="Deadline \(optional\)" type="date"/);
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /approveTunasPendingAction/);
  assert.match(source, /rejectTunasPendingAction/);
  assert.match(source, /action\.type === "OPEN_REPLAN"/);
});

test("assistant clarification has no approval controls and replan is backend gated", async () => {
  const source = await read("../src/components/app/TunasAssistant.tsx");
  assert.match(source, /!clarification/);
  assert.match(source, /impact\?\.replanSupported/);
  assert.match(source, /action\.type === "OPEN_REPLAN"/);
  assert.match(source, /sendTunasInteraction\(message, externalMessageId, assistantMissionId\)/);
});

test("operational history uses stable IDs and duplicate-safe section keys", async () => {
  const source = await read("../src/features/missions/MissionDetailView.tsx");
  assert.match(source, /key=\{report\.operationalReportId\}/);
  assert.match(source, /key=\{event\.operationalEventId\}/);
  assert.match(source, /key=\{`\$\{index\}-\$\{value\}`\}/);
  assert.match(source, /useCallback\([\s\S]*\[mission\.missionId\]\)/);
  assert.match(source, /historyRequest\.current/);
  assert.match(source, /Promise\.allSettled/);
});
