import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkAuthRateLimit, clientAddress } from "@/lib/auth/rate-limit";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(request: Request) {
  const rate = checkAuthRateLimit(`login:${clientAddress(request)}`);
  if (!rate.allowed) return NextResponse.json({ error: "Çok fazla deneme. Daha sonra tekrar deneyin." }, { status: 429, headers: { "retry-after": String(rate.retryAfter) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz giriş bilgileri." }, { status: 400 });
  const owner = await db.owner.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!owner || !(await verifyPassword(parsed.data.password, owner.passwordHash))) return NextResponse.json({ error: "Giriş bilgileri geçersiz." }, { status: 401 });
  await createSession(owner.id); return NextResponse.json({ ok: true });
}
