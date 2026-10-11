import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { attachmentInputSchema, safeAttachmentFileName, validAttachmentContent } from "@/lib/attachments/schema";
import { attachmentStorage } from "@/lib/attachments/storage";

type UploadFile = { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };
export class InvalidAttachmentContent extends Error {}

export async function createAttachment(ownerId: string, file: UploadFile) {
  const parsed = attachmentInputSchema.parse({ fileName: safeAttachmentFileName(file.name), mimeType: file.type, sizeBytes: file.size });
  const storageKey = `${ownerId}/${randomUUID()}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== parsed.sizeBytes || !validAttachmentContent(parsed.mimeType, bytes)) throw new InvalidAttachmentContent();
  await attachmentStorage.put(storageKey, bytes);
  try {
    return await db.attachment.create({ data: { ownerId, storageKey, fileName: parsed.fileName, mimeType: parsed.mimeType, sizeBytes: parsed.sizeBytes } });
  } catch (error) {
    await attachmentStorage.remove(storageKey).catch(() => console.error("Attachment upload cleanup failed."));
    throw error;
  }
}

export async function readAttachment(ownerId: string, id: string) {
  const attachment = await db.attachment.findFirst({ where: { id, ownerId } });
  if (!attachment) return null;
  const bytes = await attachmentStorage.read(attachment.storageKey);
  return { attachment, bytes };
}

export async function deleteAttachment(ownerId: string, id: string) {
  const attachment = await db.attachment.findFirst({ where: { id, ownerId }, select: { id: true, storageKey: true } });
  if (!attachment) return false;
  await attachmentStorage.remove(attachment.storageKey);
  await db.attachment.deleteMany({ where: { id: attachment.id, ownerId } });
  return true;
}
