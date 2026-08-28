import assert from "node:assert/strict";
import test from "node:test";
import { createCropBatch, createFieldBlock, deleteCropBatch, getFarmSnapshot, updateFarm } from "../src/api/farm/index.ts";

test("loads the live farm hierarchy from one backend snapshot", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  const response = {
    farm: { farmId: "farm-1", name: "Kebun Sari", location: null, notes: null, timezone: "Asia/Jakarta", defaultWorkerCount: 2, defaultWorkingHours: null, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
    fieldBlocks: [{ fieldBlockId: "field-1", farmId: "farm-1", name: "North Block", areaHectares: 0.8, coordinates: { latitude: -6.9, longitude: 107.6 }, notes: null, status: "active", createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" }],
    cropBatches: [{ cropBatchId: "batch-1", farmId: "farm-1", fieldBlockId: "field-1", crop: "shallot", variety: "Bima Brebes", plantingDate: "2026-06-01", notes: null, status: "active", createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" }],
  };
  globalThis.fetch = async (input) => { requests.push(String(input)); return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try {
    const snapshot = await getFarmSnapshot();
    assert.equal(snapshot.fieldBlocks[0].fieldBlockId, snapshot.cropBatches[0].fieldBlockId);
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((url) => new URL(url).pathname), ["/api/farm/snapshot"]);
});

test("sends CRUD payloads to the matching farm endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try {
    await updateFarm({ name: "Kebun Sari", location: null, notes: null, timezone: "Asia/Jakarta", defaultWorkerCount: 2, defaultWorkingHours: null });
    await createFieldBlock({ name: "North Block", coordinates: { latitude: -6.9, longitude: 107.6 } });
    await createCropBatch({ fieldBlockId: "field-1", variety: "Bima Brebes" });
    await deleteCropBatch("batch-1");
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/farm", "PATCH"], ["/api/field-blocks", "POST"], ["/api/crop-batches", "POST"], ["/api/crop-batches/batch-1", "DELETE"]]);
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), { name: "North Block", coordinates: { latitude: -6.9, longitude: 107.6 } });
});

test("surfaces an actionable backend error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Farm profile not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  try {
    await assert.rejects(getFarmSnapshot(), /Farm profile not found/);
  } finally { globalThis.fetch = originalFetch; }
});
