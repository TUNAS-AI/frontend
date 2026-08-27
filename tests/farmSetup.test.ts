import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_FARM_DATA } from "../src/api/farm/mockSupport/demoFarmData.ts";

test("Fields fixtures use stable unique IDs within each domain", () => {
  for (const records of [DEMO_FARM_DATA.blocks, DEMO_FARM_DATA.batches, DEMO_FARM_DATA.observations, DEMO_FARM_DATA.commitments]) {
    assert.equal(new Set(records.map((record) => record.id)).size, records.length);
  }
});

test("Fields references only configured field blocks", () => {
  const blockIds = new Set(DEMO_FARM_DATA.blocks.map((block) => block.id));
  const batchIds = new Set(DEMO_FARM_DATA.batches.map((batch) => batch.id));
  assert.ok(DEMO_FARM_DATA.batches.every((batch) => blockIds.has(batch.blockId)));
  assert.ok(DEMO_FARM_DATA.observations.every((observation) => blockIds.has(observation.blockId)));
  assert.ok(DEMO_FARM_DATA.commitments.every((commitment) => blockIds.has(commitment.blockId)));
  assert.ok(DEMO_FARM_DATA.commitments.every((commitment) => !commitment.batchId || batchIds.has(commitment.batchId)));
});

test("Field blocks expose core mission context without labour assumptions", () => {
  assert.equal(DEMO_FARM_DATA.title, "Field blocks");
  assert.ok(DEMO_FARM_DATA.blocks.length > 0);
  assert.ok(DEMO_FARM_DATA.batches.length > 0);
  assert.ok(DEMO_FARM_DATA.observations.length > 0);
  assert.ok(DEMO_FARM_DATA.commitments.length > 0);
  assert.equal(JSON.stringify(DEMO_FARM_DATA).toLowerCase().includes("worker"), false);
  assert.equal(JSON.stringify(DEMO_FARM_DATA).toLowerCase().includes("labour"), false);
  assert.ok(DEMO_FARM_DATA.batches.every((batch) => batch.crop === "Shallot"));
  assert.ok(DEMO_FARM_DATA.batches.filter((batch) => batch.mission).every((batch) => batch.mission?.href.startsWith("/missions/")));
});
