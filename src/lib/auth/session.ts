import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "lifeos_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function hashToken(token: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for sessions.");
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function createSession(ownerId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { ownerId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + MAX_AGE * 1000) } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

export async function getSessionOwner() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { owner: true } });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.session.deleteMany({ where: { tokenHash: session.tokenHash } });
    (await cookies()).delete(COOKIE);
    return null;
  }
  return session.owner;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.delete(COOKIE);
}
