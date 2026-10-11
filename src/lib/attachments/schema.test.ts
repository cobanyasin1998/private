import { describe, expect, it } from "vitest";
import { MAX_ATTACHMENT_BYTES, attachmentInputSchema, safeAttachmentFileName, validAttachmentContent } from "@/lib/attachments/schema";

describe("attachment validation", () => {
  it("accepts supported files within the size limit", () => {
    expect(attachmentInputSchema.safeParse({ fileName: "notes.pdf", mimeType: "application/pdf", sizeBytes: 1024 }).success).toBe(true);
  });

  it("rejects unsupported MIME types and oversized files", () => {
    expect(attachmentInputSchema.safeParse({ fileName: "script.js", mimeType: "application/javascript", sizeBytes: 12 }).success).toBe(false);
    expect(attachmentInputSchema.safeParse({ fileName: "large.pdf", mimeType: "application/pdf", sizeBytes: MAX_ATTACHMENT_BYTES + 1 }).success).toBe(false);
  });

  it("strips path components from user supplied names", () => {
    expect(safeAttachmentFileName("../../private/notes.txt")).toBe("notes.txt");
  });

  it("rejects spoofed images and binary text while accepting UTF-8 text", () => {
    const text = new TextEncoder().encode("Çalışma notları");
    expect(validAttachmentContent("text/plain", text)).toBe(true);
    expect(validAttachmentContent("image/png", text)).toBe(false);
    expect(validAttachmentContent("text/plain", new Uint8Array([0, 255]))).toBe(false);
    expect(validAttachmentContent("application/pdf", new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
  });
});
