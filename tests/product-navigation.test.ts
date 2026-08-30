import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses the public landing route while keeping Farm in product navigation", async () => {
  const [routes, navigation, shell] = await Promise.all([
    readFile(new URL("../src/routes/AppRoutes.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/app/productNavigation.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/app/AppShell.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(routes, /<Route index element=\{<Navigate to="\/landing" replace \/>\} \/>/);
  assert.match(routes, /path="\/landing" element=\{<LandingRoute \/>\}/);
  assert.doesNotMatch(routes, /today/i);
  assert.match(navigation, /\{ id: "farm"[\s\S]*\{ id: "missions"[\s\S]*\{ id: "calendar"/);
  assert.doesNotMatch(navigation, /today/i);
  assert.doesNotMatch(shell, /Reset onboarding|deleteFarmForOnboardingReset|RotateCcw/);
});

test("uses an accessible mobile drawer instead of a bottom bar", async () => {
  const shell = await readFile(new URL("../src/components/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(shell, /aria-label="Open navigation"/);
  assert.match(shell, /aria-label="Close navigation"/);
  assert.match(shell, /MobileNavigation/);
  assert.match(shell, /FarmSnapshotPanel/);
  assert.doesNotMatch(shell, /Mission planning and control/);
  assert.doesNotMatch(shell, /bottom-0 z-30/);
  assert.doesNotMatch(shell, /pb-36/);
  assert.doesNotMatch(shell, /<details className="rounded-lg border bg-card lg:hidden">/);
  assert.match(shell, /transition-transform duration-200[\s\S]*transitionTimingFunction: "var\(--motion-ease-out\)"/);
});

test("keeps the mobile logo and navigation trigger available while scrolling", async () => {
  const shell = await readFile(new URL("../src/components/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(shell, /sticky top-3 z-40[\s\S]*sm:top-5[\s\S]*lg:hidden/);
  assert.match(shell, /<BrandInline \/>/);
  assert.match(shell, /aria-label="Open navigation"/);
});

test("supports horizontal swipe gestures for the mobile navigation drawer", async () => {
  const shell = await readFile(new URL("../src/components/app/AppShell.tsx", import.meta.url), "utf8");

  assert.match(shell, /onPointerDown=\{startMobileNavigationSwipe\}/);
  assert.match(shell, /onPointerUp=\{finishMobileNavigationSwipe\}/);
  assert.match(shell, /SWIPE_EDGE_WIDTH/);
  assert.match(shell, /SWIPE_DISTANCE/);
});
