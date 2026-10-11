import { z } from "zod";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const attachmentIdSchema = z.string().cuid();
export const attachmentStorageKeySchema = z.string().regex(/^[a-zA-Z0-9_-]+\/[a-f0-9-]+$/);

export const allowedAttachmentMimeTypes = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const attachmentInputSchema = z.object({
  fileName: z.string().trim().min(1).max(240).refine((value) => !value.includes("\0"), "Dosya adı geçersiz."),
  mimeType: z.enum(allowedAttachmentMimeTypes),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
}).strict();

export type AttachmentInput = z.infer<typeof attachmentInputSchema>;

export function safeAttachmentFileName(fileName: string) {
  const normalized = fileName.replace(/\\/g, "/").split("/").pop()?.trim() ?? "attachment";
  return normalized.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 240) || "attachment";
}

export function validAttachmentContent(mimeType: AttachmentInput["mimeType"], bytes: Uint8Array) {
  const startsWith = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  switch (mimeType) {
    case "application/pdf": return startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "image/png": return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg": return startsWith([0xff, 0xd8, 0xff]);
    case "image/gif": return /^GIF8[79]a/.test(new TextDecoder().decode(bytes.slice(0, 6)));
    case "image/webp": return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    default:
      try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); return !bytes.includes(0); }
      catch { return false; }
  }
}
