import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { attachmentStorageKeySchema } from "@/lib/attachments/schema";

export interface AttachmentStorage {
  put(storageKey: string, bytes: Uint8Array): Promise<void>;
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}

function storageRoot() {
  return process.env.ATTACHMENTS_DIR || path.join(process.cwd(), "storage", "uploads");
}

export function resolveStoragePath(storageKey: string) {
  attachmentStorageKeySchema.parse(storageKey);
  return path.join(storageRoot(), storageKey);
}

export class LocalAttachmentStorage implements AttachmentStorage {
  async put(storageKey: string, bytes: Uint8Array) {
    const target = resolveStoragePath(storageKey);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
  }

  async read(storageKey: string) {
    return readFile(resolveStoragePath(storageKey));
  }

  async remove(storageKey: string) {
    await unlink(resolveStoragePath(storageKey)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

export const attachmentStorage: AttachmentStorage = new LocalAttachmentStorage();
