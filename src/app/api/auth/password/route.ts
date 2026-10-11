import { NextResponse } from "next/server";
import { getSessionOwner, createSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { passwordChangeSchema } from "@/lib/auth/password-change";

export async function PATCH(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const rate = checkAuthRateLimit(`password:${owner.id}`, 5);
  if (!rate.allowed) return NextResponse.json({ error: "Çok fazla deneme. Daha sonra tekrar deneyin." }, { status: 429, headers: { "retry-after": String(rate.retryAfter) } });
  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  if (!(await verifyPassword(parsed.data.currentPassword, owner.passwordHash))) return NextResponse.json({ error: "Mevcut şifre geçersiz." }, { status: 400 });
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.$transaction(async (tx) => {
    await tx.owner.update({ where: { id: owner.id }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { ownerId: owner.id } });
  });
  await createSession(owner.id);
  return NextResponse.json({ ok: true });
}
