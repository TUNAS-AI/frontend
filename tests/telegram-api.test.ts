import assert from "node:assert/strict";
import test from "node:test";
import { beginTelegramConnection, getTelegramStatus } from "../src/api/telegram/index.ts";

test("uses authenticated Telegram connection endpoints", async () => {
  const originalFetch = globalThis.fetch; const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => { requests.push({ url: String(input), init }); return new Response(JSON.stringify({ connected: false, connectionUrl: "https://t.me/test" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  try { await getTelegramStatus(); await beginTelegramConnection(); } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(requests.map((request) => [new URL(request.url).pathname, request.init?.method]), [["/api/telegram", undefined], ["/api/telegram/connect", "POST"]]);
});
