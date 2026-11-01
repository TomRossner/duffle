import assert from "node:assert/strict";
import test from "node:test";
import { pickSuccessor } from "./account-departure.ts";

test("pickSuccessor prefers an admin, then the lowest user id", () => {
  const chosen = pickSuccessor([
    { id: "m1", userId: "b", role: "MEMBER" },
    { id: "m2", userId: "c", role: "ADMIN" },
    { id: "m3", userId: "a", role: "ADMIN" },
  ]);
  assert.equal(chosen?.userId, "a");
});

test("pickSuccessor is empty when nobody else remains", () => {
  assert.equal(pickSuccessor([]), null);
});
