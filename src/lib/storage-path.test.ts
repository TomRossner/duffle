import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resolveUploadPath } from "./storage.ts";

test("resolveUploadPath stays inside the uploads directory", () => {
  const root = path.join(os.tmpdir(), "duffle-uploads");
  const full = resolveUploadPath(root, "identity/user/photo.jpg");
  assert.equal(full, path.join(root, "identity", "user", "photo.jpg"));
});

test("resolveUploadPath rejects a key that leaves the directory", () => {
  assert.throws(() => resolveUploadPath(path.join(os.tmpdir(), "duffle-uploads"), "../secret"));
});
