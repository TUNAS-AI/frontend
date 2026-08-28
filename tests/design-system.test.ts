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

test("provides shared motion and skeleton loading primitives", async () => {
  const [styles, skeleton, loadingShell, farmRoute, missionsRoute, missionDetailRoute] = await Promise.all([
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ui/Skeleton.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ui/LoadingShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/FarmRoute.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/MissionsRoute.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/MissionDetailRoute.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.motion-enter/);
  assert.match(styles, /@keyframes tunas-skeleton-shimmer/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(skeleton, /aria-hidden="true"/);
  assert.match(loadingShell, /<Skeleton/);
  assert.match(farmRoute, /<LoadingShell/);
  assert.match(missionsRoute, /<LoadingShell/);
  assert.match(missionDetailRoute, /<LoadingShell/);
});
