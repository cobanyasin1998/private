import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { createAttachment, InvalidAttachmentContent } from "@/lib/attachments/service";
import { getAttachments } from "@/lib/attachments/queries";
import { attachmentMessages } from "@/lib/attachments/messages";
import { MAX_ATTACHMENT_BYTES } from "@/lib/attachments/schema";

export const runtime = "nodejs";

export async function GET() {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const attachments = await getAttachments(owner.id);
  return NextResponse.json(attachments, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const text = attachmentMessages(owner.locale);
  if (Number(request.headers.get("content-length")) > MAX_ATTACHMENT_BYTES + 65536) return NextResponse.json({ error: text.tooLarge }, { status: 413 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file) || !("name" in file) || !("type" in file) || !("size" in file)) {
    return NextResponse.json({ error: text.required }, { status: 400 });
  }
  try {
    const attachment = await createAttachment(owner.id, file as File);
    return NextResponse.json({ id: attachment.id, fileName: attachment.fileName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, createdAt: attachment.createdAt }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: text.invalid }, { status: 422 });
    if (error instanceof InvalidAttachmentContent) return NextResponse.json({ error: text.mismatch }, { status: 422 });
    console.error("Attachment upload failed.");
    return NextResponse.json({ error: text.uploadFailed }, { status: 500 });
  }
}
