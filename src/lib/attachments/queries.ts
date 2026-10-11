import { db } from "@/lib/db";

export function getAttachments(ownerId: string) {
  return db.attachment.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } });
}
