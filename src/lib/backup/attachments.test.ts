import { describe, expect, it, vi } from "vitest";
import { verifyBackupAttachments } from "@/lib/backup/attachments";
import type { BackupPayload } from "@/lib/backup/schema";

const attachment: BackupPayload["data"]["attachments"][number] = {
  id: "attachment-1", ownerId: "source-owner", storageKey: "source-owner/abc-123",
  fileName: "note.txt", mimeType: "text/plain", sizeBytes: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("backup attachment preflight", () => {
  it("accepts files with matching size and type without altering storage", async () => {
    const read = vi.fn().mockResolvedValue(Buffer.from("hello"));
    await expect(verifyBackupAttachments([attachment], { read })).resolves.toEqual({ verifiedCount: 1, totalBytes: 5 });
    expect(read).toHaveBeenCalledExactlyOnceWith(attachment.storageKey);
  });

  it("does not require storage access when the backup has no attachments", async () => {
    const read = vi.fn();
    await expect(verifyBackupAttachments([], { read })).resolves.toEqual({ verifiedCount: 0, totalBytes: 0 });
    expect(read).not.toHaveBeenCalled();
  });

  it("rejects traversal keys before accessing the storage adapter", async () => {
    const read = vi.fn();
    await expect(verifyBackupAttachments([{ ...attachment, storageKey: "../../secret" }], { read })).rejects.toThrow("geçersiz");
    expect(read).not.toHaveBeenCalled();
  });

  it("rejects unreadable or missing files", async () => {
    const read = vi.fn().mockRejectedValue(new Error("ENOENT"));
    await expect(verifyBackupAttachments([attachment], { read })).rejects.toThrow("ATTACHMENTS_DIR");
  });

  it("rejects files whose byte length differs from the metadata", async () => {
    const read = vi.fn().mockResolvedValue(Buffer.from("shorter or longer"));
    await expect(verifyBackupAttachments([attachment], { read })).rejects.toThrow("boyutu");
  });

  it("rejects files whose type signature differs even when their size matches", async () => {
    const read = vi.fn().mockResolvedValue(Buffer.from("hello"));
    await expect(verifyBackupAttachments([{ ...attachment, mimeType: "application/pdf" }], { read })).rejects.toThrow("içeriği");
  });
});
