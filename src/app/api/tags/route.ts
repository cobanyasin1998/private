import { NextResponse } from "next/server";
import { getSessionOwner } from "@/lib/auth/session";
import { getEntityTagIds, getTags } from "@/features/tags/queries";
import { assignTags, createTag } from "@/features/tags/actions";
import { tagAssignmentSchema, tagInputSchema } from "@/features/tags/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (entityType && entityId) {
    const parsed = tagAssignmentSchema.pick({ entityType: true, entityId: true }).safeParse({ entityType, entityId });
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz kayıt." }, { status: 400 });
    return NextResponse.json({ tagIds: await getEntityTagIds(owner.id, parsed.data.entityType, parsed.data.entityId) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json({ tags: await getTags(owner.id) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 }); }
  const assignment = tagAssignmentSchema.safeParse(body);
  if (assignment.success) {
    const result = await assignTags(assignment.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }
  const tag = tagInputSchema.safeParse(body);
  if (!tag.success) return NextResponse.json({ error: "Formu kontrol edin.", fieldErrors: tag.error.flatten().fieldErrors }, { status: 422 });
  const result = await createTag(tag.data);
  return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}

