import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routesPath = new URL("../src/routes/AppRoutes.tsx", import.meta.url);
const landingPath = new URL("../src/routes/LandingRoute.tsx", import.meta.url);
const stylesPath = new URL("../src/styles.css", import.meta.url);

test("exposes the public TUNAS landing page from the root route", async () => {
  const [routes, landing] = await Promise.all([
    readFile(routesPath, "utf8"),
    readFile(landingPath, "utf8"),
  ]);

  assert.match(routes, /path="\/landing" element=\{<LandingRoute \/>\}/);
  assert.match(routes, /<Route index element=\{<Navigate to="\/landing" replace \/>\} \/>/);
  assert.match(landing, /to="\/login"/);
  assert.match(landing, /Open TUNAS/);
  assert.match(landing, /AI-assisted estimates support planning; review every plan before you act\./);
});

test("provides fixed section navigation, compact full-width footer, and contextual mascots", async () => {
  const [landing, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(landing, /href="#home"/);
  assert.match(landing, /href="#problem"/);
  assert.match(landing, /href="#solution"/);
  assert.match(landing, /id="home"/);
  assert.match(landing, /id="problem"/);
  assert.match(landing, /id="solution"/);
  assert.match(landing, /mascot-shocked\.png/);
  assert.match(landing, /mascot-eureka\.png/);
  assert.match(styles, /\.landing-nav\s*\{[\s\S]*?position: fixed;/);
  assert.match(styles, /\.landing-solution-intro\s*\{[\s\S]*?text-align: center;/);
  assert.match(styles, /\.landing-footer\s*\{[\s\S]*?width: 100%;[\s\S]*?padding: 1rem/);
});

test("replaces the dark closing panel with transparent TUNAS capabilities", async () => {
  const [landing, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(landing, /WHAT TUNAS CAN DO/);
  assert.match(landing, /Proactive risk alerts/);
  assert.match(landing, /Weather-aware missions/);
  assert.match(landing, /Outcome-informed recommendations/);
  assert.match(landing, /recorded past harvest outcomes/);
  assert.match(landing, /landing-features/);
  assert.match(styles, /\.landing-features\s*\{[^}]*background: transparent;/);
  assert.doesNotMatch(styles, /\.landing-features\s*\{[^}]*background: #1d4428;/);
});

test("keeps mobile hero support and footer content in normal, structured flow", async () => {
  const [landing, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(landing, /className="landing-hero-companion"/);
  assert.match(landing, /className="landing-footer-content"/);
  assert.match(styles, /\.landing-hero-companion\s*\{[^}]*display: contents;/);
  assert.match(styles, /@media \(max-width: 699px\) \{[\s\S]*?\.landing-hero-companion\s*\{[^}]*position: static;[^}]*display: flex;/);
  assert.match(styles, /@media \(max-width: 699px\) \{[\s\S]*?\.landing-hero\s*\{[^}]*min-height: auto;/);
  assert.match(styles, /@media \(max-width: 699px\) \{[\s\S]*?\.landing-footer-content\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/);
});
