import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authViewPath = new URL("../src/features/auth/AuthView.tsx", import.meta.url);
const stylesPath = new URL("../src/styles.css", import.meta.url);

test("login keeps the harvest image decorative and the assistant below sign-in on compact screens", async () => {
  const [source, styles] = await Promise.all([readFile(authViewPath, "utf8"), readFile(stylesPath, "utf8")]);

  assert.match(source, /auth-mobile-hero relative h-32 overflow-hidden sm:h-40 lg:hidden/);
  assert.match(source, /alt=""/);
  assert.match(source, /auth-panel relative flex min-h-\[calc\(100dvh-8rem\)\] flex-col/);
  assert.match(source, /auth-assistant pointer-events-none mt-10 flex w-full items-end justify-end lg:absolute/);
  assert.doesNotMatch(source, /auth-assistant pointer-events-none absolute bottom-0 right-0/);
  assert.match(source, /auth-mascot-peek -mr-8 -mb-8 h-28[^"]*sm:-mr-12 sm:-mb-10[^"]*lg:-mr-3 lg:mb-0/);
  assert.match(source, /auth-hero relative hidden min-h-dvh overflow-hidden lg:block/);
  assert.doesNotMatch(styles, /\.auth-frame\s*\{\s*min-height:/);
  assert.match(source, /<h1 className="mt-3 text-balance text-4xl[^>]*">\{copy\.loginTitle\}<\/h1>/);
  assert.doesNotMatch(source, /<h1[^>]*>\{copy\.headline\}<\/h1>/);
});
