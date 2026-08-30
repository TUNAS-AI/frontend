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

  assert.equal(payload.farm.name, "Tani Makmur Brebes");
  assert.equal(payload.farm.defaultWorkerCount, 4);
  assert.deepEqual(payload.farm.defaultWorkingHours.monday, [{ start: "06:00", end: "16:00" }]);
  assert.deepEqual(payload.farm.defaultWorkingHours.saturday, [{ start: "06:00", end: "16:00" }]);
  assert.match(payload.farm.notes ?? "", /Pak Dedi, Pak Ujang, Bu Sari, and Pak Wawan/);
  assert.match(payload.farm.notes ?? "", /outdoor drying/);
  assert.match(payload.farm.notes ?? "", /tarpaulin available/);
  assert.equal(payload.fields.length, 1);
  assert.equal(payload.fields[0].name, "Blok Utara");
  assert.deepEqual(payload.fields[0].coordinates, { latitude: -6.86712, longitude: 109.037109 });
  assert.equal(payload.fields[0].cropBatches[0].variety, "Bima Brebes");
  assert.match(payload.fields[0].cropBatches[0].notes ?? "", /READY/);
  assert.match(payload.fields[0].cropBatches[0].notes ?? "", /650 kg/);

  const planted = new Date(`${payload.fields[0].cropBatches[0].plantingDate}T00:00:00`);
  const ageDays = Math.round((new Date().setHours(0, 0, 0, 0) - planted.getTime()) / 86_400_000);
  assert.ok(ageDays >= 61 && ageDays <= 63, `expected a relative planting age near 62 days, received ${ageDays}`);
});
