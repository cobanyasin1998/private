import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseBackupPayload } from "@/lib/backup/schema";
import { restoreBackup } from "@/lib/backup/restore";
import { verifyBackupAttachments } from "@/lib/backup/attachments";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/lib/attachments/storage", () => ({ attachmentStorage: { read: mocks.read } }));

const payload = parseBackupPayload({
  schemaVersion: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  owner: { id: "source-owner", email: "owner@example.com", displayName: "Owner", timezone: "Europe/Istanbul", locale: "tr", currency: "TRY", weekStartsOn: 1 },
  data: {
    settings: [], modulePrefs: [], tags: [],
    attachments: [{ id: "attachment-1", ownerId: "source-owner", storageKey: "source-owner/abc-123", fileName: "note.txt", mimeType: "text/plain", sizeBytes: 5, createdAt: "2026-01-01T00:00:00.000Z" }],
    movies: [], series: [], books: [], accounts: [], categories: [], transactions: [], budgets: [], courses: [], projects: [], tasks: [], notes: [], habits: [], goals: [], subscriptions: [], activityEvents: [],
  },
});

describe("restore attachment guard", () => {
  beforeEach(() => vi.resetAllMocks());

  it("does not begin a destructive database transaction if an attachment is missing", async () => {
    mocks.read.mockRejectedValue(new Error("ENOENT"));
    await expect(restoreBackup("destination-owner", payload)).rejects.toThrow("okunamadı");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rechecks files after a successful preview and rejects a size change before the transaction", async () => {
    mocks.read.mockResolvedValueOnce(Buffer.from("hello")).mockResolvedValueOnce(Buffer.from("altered"));
    await verifyBackupAttachments(payload.data.attachments);
    await expect(restoreBackup("destination-owner", payload)).rejects.toThrow("boyutu");
    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
