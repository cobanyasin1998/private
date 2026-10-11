// @vitest-environment node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalAttachmentStorage } from "@/lib/attachments/storage";

describe("persistent local attachment storage", () => {
  let directory: string;
  const storage = new LocalAttachmentStorage();
  beforeEach(async () => { directory = await mkdtemp(path.join(tmpdir(), "lifeos-files-")); vi.stubEnv("ATTACHMENTS_DIR", directory); });
  afterEach(async () => { await rm(directory, { recursive: true, force: true }); vi.unstubAllEnvs(); });

  it("round-trips bytes, refuses overwrite and removes idempotently", async () => {
    const key = "owner-test/00000000-1111-4444-8888-000000000000";
    const bytes = Buffer.from("Private study notes.");
    await storage.put(key, bytes);
    expect(await storage.read(key)).toEqual(bytes);
    await expect(storage.put(key, Buffer.from("replacement"))).rejects.toThrow();
    expect(await storage.read(key)).toEqual(bytes);
    await storage.remove(key);
    await storage.remove(key);
    await expect(storage.read(key)).rejects.toThrow();
  });

  it("rejects traversal and absolute storage keys", async () => {
    for (const key of ["../../.env", "/tmp/private", "owner/../file", "owner\\secret", "owner/test.txt"]) {
      await expect(storage.put(key, Buffer.from("no"))).rejects.toThrow();
      await expect(storage.read(key)).rejects.toThrow();
      await expect(storage.remove(key)).rejects.toThrow();
    }
  });
});
