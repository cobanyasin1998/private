import { attachmentStorageKeySchema, validAttachmentContent } from "@/lib/attachments/schema";
import { attachmentStorage, type AttachmentStorage } from "@/lib/attachments/storage";
import type { BackupPayload } from "@/lib/backup/schema";

export class BackupAttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupAttachmentError";
  }
}

/** JSON exports contain metadata only. Verify the separate file backup before
 * allowing a restore to replace any database records. This never alters files. */
export async function verifyBackupAttachments(
  attachments: BackupPayload["data"]["attachments"],
  storage: Pick<AttachmentStorage, "read"> = attachmentStorage,
) {
  let totalBytes = 0;
  for (const attachment of attachments) {
    if (!attachmentStorageKeySchema.safeParse(attachment.storageKey).success) {
      throw new BackupAttachmentError("Yedekte geçersiz bir dosya depolama anahtarı var.");
    }

    let bytes: Buffer;
    try {
      bytes = await storage.read(attachment.storageKey);
    } catch {
      throw new BackupAttachmentError(`“${attachment.fileName}” dosyası okunamadı. JSON dosyası eklerin içeriğini taşımaz; dosya yedeğini önce ATTACHMENTS_DIR dizinine kopyala.`);
    }
    if (bytes.byteLength !== attachment.sizeBytes) {
      throw new BackupAttachmentError(`“${attachment.fileName}” dosyasının boyutu yedek kaydıyla eşleşmiyor. Doğru dosya yedeğini ATTACHMENTS_DIR dizinine kopyala.`);
    }
    if (!validAttachmentContent(attachment.mimeType, bytes)) {
      throw new BackupAttachmentError(`“${attachment.fileName}” dosyasının içeriği dosya türüyle eşleşmiyor. Doğru dosya yedeğini ATTACHMENTS_DIR dizinine kopyala.`);
    }
    totalBytes += bytes.byteLength;
  }
  return { verifiedCount: attachments.length, totalBytes };
}
