import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { actionVariants, statusVariants, surfaceVariants } from "../src/components/ui/semantics.ts";

test("exposes one action and status vocabulary for UI primitives", () => {
  assert.deepEqual(actionVariants, ["primary", "secondary", "outline", "ghost", "danger", "warning", "link"]);
  assert.deepEqual(statusVariants, ["neutral", "info", "success", "warning", "danger", "ai", "source"]);
  assert.deepEqual(surfaceVariants, ["default", "subtle", "highlight", "success"]);
});

test("does not expose the retired legacy route", async () => {
  const routes = await readFile(new URL("../src/routes/AppRoutes.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(routes, /path="\/legacy"/);
});
