import { test as base, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHmac, randomBytes } from "node:crypto";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
export const prisma = new PrismaClient();

/** Each browser scenario gets a synthetic owner; cleanup never touches real data. */
const ownerIdFixture = async ({ context }: { context: import("@playwright/test").BrowserContext }, fixtureUse: (ownerId: string) => Promise<void>) => {
    const token = randomBytes(32).toString("base64url");
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET must be configured to run authenticated browser tests.");
    const owner = await prisma.owner.create({ data: {
      email: `learning-e2e-${randomBytes(12).toString("hex")}@example.invalid`,
      displayName: "Öğrenme testi", passwordHash: "unused-e2e-password-hash",
      sessions: { create: { tokenHash: createHmac("sha256", secret).update(token).digest("hex"), expiresAt: new Date(Date.now() + 3_600_000) } },
    } });
    await context.addCookies([{ name: "lifeos_session", value: token, url: "http://127.0.0.1:3000", httpOnly: true, sameSite: "Lax" }]);
    try { await fixtureUse(owner.id); } finally { await prisma.owner.delete({ where: { id: owner.id } }); }
};

export const test = base.extend<{ ownerId: string }>({
  ownerId: ownerIdFixture,
});
export { expect };
