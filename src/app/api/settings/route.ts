import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionOwner } from "@/lib/auth/session";

const schema = z.object({
  locale: z.literal("tr").optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  timezone: z.string().min(1).max(80).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
});

export async function GET() {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  return NextResponse.json({ locale: owner.locale, currency: owner.currency, timezone: owner.timezone, weekStartsOn: owner.weekStartsOn });
}

export async function PATCH(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz ayar." }, { status: 400 });
  const updated = await db.owner.update({ where: { id: owner.id }, data: { ...parsed.data, locale: "tr" } });
  return NextResponse.json({ locale: updated.locale, currency: updated.currency, timezone: updated.timezone, weekStartsOn: updated.weekStartsOn });
}
