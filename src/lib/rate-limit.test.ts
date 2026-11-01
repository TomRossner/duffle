import assert from "node:assert/strict";
import test from "node:test";
import { clearRateLimits, takeRateLimit } from "./rate-limit.ts";

test("takeRateLimit blocks after the limit inside the window", () => {
  clearRateLimits();
  const now = 1_000;
  assert.equal(takeRateLimit("login:1", 2, 500, now).ok, true);
  assert.equal(takeRateLimit("login:1", 2, 500, now + 1).ok, true);
  const blocked = takeRateLimit("login:1", 2, 500, now + 2);
  assert.equal(blocked.ok, false);
  assert.equal(takeRateLimit("login:1", 2, 500, now + 500).ok, true);
});
