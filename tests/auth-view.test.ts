import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authViewPath = new URL("../src/features/auth/AuthView.tsx", import.meta.url);
const stylesPath = new URL("../src/styles.css", import.meta.url);

test("login hero uses an accessible dark treatment and keeps sign-in as the page heading", async () => {
  const [source, styles] = await Promise.all([readFile(authViewPath, "utf8"), readFile(stylesPath, "utf8")]);

  assert.match(source, /auth-hero relative hidden min-h-\[30rem\]/);
  assert.doesNotMatch(source, /auth-panel grid min-h-/);
  assert.doesNotMatch(styles, /\.auth-frame\s*\{\s*min-height:/);
  assert.match(source, /bg-gradient-to-b from-forest-700\/80 via-black\/55 to-black\/30/);
  assert.match(source, /<p className="mt-12 text-4xl[^>]*text-white(?:\s|")[^>]*">\{copy\.headline\}<\/p>/);
  assert.match(source, /<h1 className="mt-2 text-3xl[^>]*">\{copy\.loginTitle\}<\/h1>/);
  assert.doesNotMatch(source, /<h1[^>]*>\{copy\.headline\}<\/h1>/);
});
