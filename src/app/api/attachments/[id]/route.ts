import { NextResponse } from "next/server";
import { getSessionOwner } from "@/lib/auth/session";
import { deleteAttachment, readAttachment } from "@/lib/attachments/service";
import { attachmentMessages } from "@/lib/attachments/messages";
import { attachmentIdSchema } from "@/lib/attachments/schema";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const text = attachmentMessages(owner.locale);
  const { id } = await params;
  if (!attachmentIdSchema.safeParse(id).success) return NextResponse.json({ error: text.invalidId }, { status: 400 });
  const result = await readAttachment(owner.id, id).catch(() => null);
  if (!result) return NextResponse.json({ error: text.notFound }, { status: 404 });
  return new NextResponse(new Uint8Array(result.bytes), { headers: { "content-type": result.attachment.mimeType, "content-length": String(result.bytes.byteLength), "content-disposition": `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(result.attachment.fileName).replace(/'/g, "%27")}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const text = attachmentMessages(owner.locale);
  const { id } = await params;
  if (!attachmentIdSchema.safeParse(id).success) return NextResponse.json({ error: text.invalidId }, { status: 400 });
  try {
    const removed = await deleteAttachment(owner.id, id);
    if (!removed) return NextResponse.json({ error: text.notFound }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: text.deleteFailed }, { status: 500 });
  }
}
