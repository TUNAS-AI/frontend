import assert from "node:assert/strict";
import test from "node:test";
import { validateFieldBlockForm } from "../src/features/farm/fieldBlockForm.ts";

test("accepts WGS84 boundary coordinates for a field block", () => {
  const result = validateFieldBlockForm({ name: "Boundary field", latitude: "-90", longitude: "180", areaHectares: "", notes: "", status: "" });

  assert.deepEqual(result, {
    input: { name: "Boundary field", coordinates: { latitude: -90, longitude: 180 }, areaHectares: null, notes: null },
    errors: {},
    firstInvalid: null,
  });
});

test("rejects an out-of-range latitude before saving", () => {
  const result = validateFieldBlockForm({ name: "Invalid field", latitude: "-91", longitude: "107.6", areaHectares: "", notes: "", status: "" });

  assert.equal(result.input, null);
  assert.equal(result.errors.latitude, "Latitude must be between -90 and 90.");
  assert.equal(result.firstInvalid, "latitude");
});

test("rejects a non-positive field area before saving", () => {
  const result = validateFieldBlockForm({ name: "Invalid field", latitude: "-6.9", longitude: "107.6", areaHectares: "0", notes: "", status: "" });

  assert.equal(result.input, null);
  assert.equal(result.errors.areaHectares, "Area must be greater than zero.");
  assert.equal(result.firstInvalid, "areaHectares");
});
