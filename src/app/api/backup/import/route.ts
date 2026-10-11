import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { backupSummary, parseBackupPayload } from "@/lib/backup/schema";
import { restoreBackup } from "@/lib/backup/restore";
import { BackupAttachmentError, verifyBackupAttachments } from "@/lib/backup/attachments";

export const runtime = "nodejs";

/**
 * POST { mode: "preview" | "restore", backup: <export>, confirm?: "RESTORE" }
 *
 * Preview is read-only. Restore intentionally requires the literal RESTORE
 * confirmation in the request so a browser prefetch or accidental POST cannot
 * delete personal records.
 */
export async function POST(request: Request) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçerli bir JSON gövdesi gerekli." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("backup" in body)) return NextResponse.json({ error: "backup alanı gerekli." }, { status: 400 });
  const input = body as { mode?: unknown; backup: unknown; confirm?: unknown };
  const mode = input.mode === "restore" ? "restore" : input.mode === "preview" ? "preview" : null;
  if (!mode) return NextResponse.json({ error: "mode preview veya restore olmalı." }, { status: 400 });

  try {
    const payload = parseBackupPayload(input.backup);
    const summary = backupSummary(payload);
    if (mode === "preview") {
      const attachments = await verifyBackupAttachments(payload.data.attachments);
      return NextResponse.json({ ok: true, mode, summary, attachments }, { headers: { "cache-control": "private, no-store" } });
    }
    if (input.confirm !== "RESTORE") return NextResponse.json({ error: "Geri yükleme için confirm alanı RESTORE olmalı." }, { status: 400 });

    const result = await restoreBackup(owner.id, payload);
    return NextResponse.json({ ok: true, mode, summary, result }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof BackupAttachmentError) return NextResponse.json({ error: error.message }, { status: 422 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Yedek şeması geçersiz.", issues: error.issues.slice(0, 20) }, { status: 422 });
    const message = error instanceof Error ? error.message : "Yedek doğrulanamadı.";
    if (message.includes("yinelenen") || message.includes("geçersiz") || message.includes("Required") || message.includes("Invalid")) return NextResponse.json({ error: message }, { status: 422 });
    console.error("backup restore failed", error);
    return NextResponse.json({ error: "Yedek geri yüklenemedi." }, { status: 500 });
  }
}
