import assert from "node:assert/strict";
import test from "node:test";
import { buildOnboardingPayload, createDemoOnboardingDraft, createFieldDraft } from "../src/features/auth/onboarding.ts";

test("builds the backend onboarding payload from nested field and batch drafts", () => {
  const field = createFieldDraft(0);
  field.name = "North Block";
  field.latitude = "-6.914744";
  field.longitude = "107.60981";
  field.cropBatches[0].variety = "Bima Brebes";
  field.cropBatches[0].plantingDate = "2026-05-15";

  const payload = buildOnboardingPayload({
    farm: {
      name: "Kebun Cisarua",
      defaultWorkerCount: "3",
      location: "Bogor",
      notes: "",
      timezone: "Asia/Jakarta",
      workWindows: [{ day: "monday", start: "06:00", end: "11:00" }],
    },
    fields: [field],
  });

  assert.deepEqual(payload.farm.defaultWorkingHours, { monday: [{ start: "06:00", end: "11:00" }] });
  assert.equal(payload.fields[0].coordinates.latitude, -6.914744);
  assert.equal(payload.fields[0].cropBatches[0].variety, "Bima Brebes");
});

test("requires a crop batch for every field", () => {
  const field = createFieldDraft(0);
  field.name = "North Block";
  field.latitude = "-6.914744";
  field.longitude = "107.60981";
  field.cropBatches = [];

  assert.throws(
    () => buildOnboardingPayload({
      farm: { name: "Kebun Cisarua", defaultWorkerCount: "1", location: "", notes: "", timezone: "Asia/Jakarta", workWindows: [{ day: "monday", start: "06:00", end: "11:00" }] },
      fields: [field],
    }),
    /Add at least one crop batch to North Block/,
  );
});

test("creates a complete demonstration onboarding draft without submitting it", () => {
  const draft = createDemoOnboardingDraft();
  const payload = buildOnboardingPayload(draft);

  assert.equal(payload.farm.name, "Kebun Sari Tani");
  assert.equal(payload.fields.length, 1);
  assert.equal(payload.fields[0].name, "North Block");
  assert.equal(payload.fields[0].cropBatches[0].variety, "Bima Brebes");
});
