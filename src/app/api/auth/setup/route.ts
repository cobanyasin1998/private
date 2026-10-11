import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkAuthRateLimit, clientAddress } from "@/lib/auth/rate-limit";

const schema = z.object({ bootstrapToken: z.string().min(1), displayName: z.string().trim().min(1).max(80), email: z.string().email(), password: z.string().min(12).max(200) });
export async function POST(request: Request) {
  const rate = checkAuthRateLimit(`setup:${clientAddress(request)}`, 5);
  if (!rate.allowed) return NextResponse.json({ error: "Çok fazla deneme. Daha sonra tekrar deneyin." }, { status: 429, headers: { "retry-after": String(rate.retryAfter) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.bootstrapToken !== process.env.BOOTSTRAP_TOKEN) return NextResponse.json({ error: "Kurulum anahtarı veya bilgiler geçersiz." }, { status: 400 });
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const owner = await db.$transaction(async (tx) => {
      // Serialize installation attempts even when they use different email addresses.
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(1379872210)`;
      if (await tx.owner.count() > 0) throw new Error("OWNER_EXISTS");
      return tx.owner.create({ data: { email: parsed.data.email.toLowerCase(), displayName: parsed.data.displayName, passwordHash } });
    });
    await createSession(owner.id); return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "OWNER_EXISTS") return NextResponse.json({ error: "Sahip hesabı zaten oluşturulmuş." }, { status: 409 });
    return NextResponse.json({ error: "Kurulum tamamlanamadı." }, { status: 500 });
  }
}
