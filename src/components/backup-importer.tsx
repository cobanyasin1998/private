"use client";

import { useState } from "react";

type Summary = { source: { email: string; displayName: string }; exportedAt: string; counts: Record<string, number> };
type VerifiedAttachments = { verifiedCount: number; totalBytes: number };

export function BackupImporter() {
  const [backup, setBackup] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [attachments, setAttachments] = useState<VerifiedAttachments | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function preview() {
    if (!backup) return setMessage("Önce bir JSON yedek dosyası seç.");
    setBusy(true); setMessage(""); setSummary(null); setAttachments(null);
    try {
      const response = await fetch("/api/backup/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "preview", backup }) });
      const result = await response.json() as { error?: string; summary?: Summary; attachments?: VerifiedAttachments };
      if (!response.ok || !result.summary) throw new Error(result.error ?? "Yedek doğrulanamadı.");
      setSummary(result.summary); setAttachments(result.attachments ?? null); setMessage("Önizleme hazır. Mevcut kayıtların geri yükleme sırasında silinip yedekteki kayıtlarla değiştirileceğini kontrol et.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Yedek doğrulanamadı."); }
    finally { setBusy(false); }
  }

  async function restore() {
    if (!backup || confirmation !== "RESTORE") return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/backup/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "restore", backup, confirm: confirmation }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Geri yükleme başarısız.");
      setMessage("Yedek geri yüklendi. Sayfayı yenileyerek güncel verileri görebilirsin."); setConfirmation("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Geri yükleme başarısız."); }
    finally { setBusy(false); }
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name); setSummary(null); setAttachments(null); setConfirmation(""); setMessage("");
    try { setBackup(JSON.parse(await file.text())); }
    catch { setBackup(null); setMessage("Dosya geçerli bir JSON değil."); }
  }

  return <div className="mt-5 space-y-4">
    <p className="text-xs leading-5 text-muted-foreground">JSON yedeği ek dosyaların yalnızca bilgilerini içerir. Dosya yedeğini önce sunucudaki ATTACHMENTS_DIR dizinine, alt klasörlerini koruyarak kopyala. Eksik veya uyumsuz dosya varsa geri yükleme başlamaz.</p>
    <input type="file" accept="application/json,.json" onChange={(event) => void chooseFile(event.target.files?.[0])} className="block w-full rounded-lg border px-3 py-2 text-sm" />
    {fileName && <p className="text-xs text-muted-foreground">Seçilen dosya: {fileName}</p>}
    <button type="button" onClick={() => void preview()} disabled={busy || !backup} className="w-full rounded-lg border px-3 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">{busy ? "İşleniyor…" : "Yedeği doğrula ve önizle"}</button>
    {summary && <div className="rounded-lg border bg-muted/30 p-4 text-xs leading-6"><p><strong>Kaynak:</strong> {summary.source.displayName} ({summary.source.email})</p><p><strong>Tarih:</strong> {new Date(summary.exportedAt).toLocaleString("tr-TR")}</p><p><strong>Kayıtlar:</strong> {Object.entries(summary.counts).filter(([, count]) => count > 0).map(([key, count]) => `${key}: ${count}`).join(" · ") || "boş"}</p></div>}
    {attachments && attachments.verifiedCount > 0 && <p className="text-xs leading-5 text-muted-foreground">Sunucudaki {attachments.verifiedCount} ek dosyanın boyut ve tür kontrolleri geçti ({attachments.totalBytes.toLocaleString("tr-TR")} bayt).</p>}
    {summary && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"><p className="text-xs leading-5 text-muted-foreground">Geri yükleme mevcut kişisel kayıtlarını kalıcı olarak siler ve yedekteki kayıtlarla değiştirir. Devam etmek için aşağıya RESTORE yaz.</p><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="RESTORE" className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm" /><button type="button" onClick={() => void restore()} disabled={busy || confirmation !== "RESTORE"} className="mt-3 w-full rounded-lg bg-destructive px-3 py-2.5 text-sm font-medium text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50">Yedeği geri yükle</button></div>}
    {message && <p role="status" className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">{message}</p>}
  </div>;
}
