import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { actionVariants, statusVariants, surfaceVariants } from "../src/components/ui/semantics.ts";

test("exposes one action and status vocabulary for UI primitives", () => {
  assert.deepEqual(actionVariants, ["primary", "secondary", "outline", "ghost", "danger", "dangerOutline", "warning", "link"]);
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

test("uses a compact TUNAS launcher and typing indicators while assistant context loads", async () => {
  const [assistant, styles] = await Promise.all([
    readFile(new URL("../src/components/app/TunasAssistant.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(assistant, /bottom-\[calc\(env\(safe-area-inset-bottom\)\+0\.75rem\)\]/);
  assert.match(assistant, /\/images\/tunas-ai-icon-white\.png/);
  assert.doesNotMatch(assistant, /Sparkles/);
  assert.match(assistant, /sm:h-14 sm:w-auto sm:min-h-14 sm:px-6/);
  assert.match(assistant, /<span className="hidden sm:inline">Tunas AI<\/span>/);
  assert.match(assistant, /TunasTypingIndicator/);
  assert.match(styles, /@keyframes tunas-typing-dot/);
  assert.match(styles, /\.tunas-typing-indicator > span\s*\{\s*animation: none;/);
});

test("centers confirmation dialogs within the mobile viewport", async () => {
  const [alertDialog, styles] = await Promise.all([
    readFile(new URL("../src/components/ui/alert-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(alertDialog, /max-h-\[calc\(100dvh-2rem\)\] w-\[calc\(100%-2rem\)\][\s\S]*-translate-x-1\/2 -translate-y-1\/2[\s\S]*overflow-y-auto/);
  assert.match(alertDialog, /flex flex-col-reverse gap-2 \[&>\*\]:w-full sm:flex-row sm:justify-end sm:space-x-2 sm:\[&>\*\]:w-auto/);
  assert.match(styles, /\[data-tunas-alert-dialog-content\] \{\s*transform: translate\(-50%, -50%\) translateY\(8px\);/);
});
