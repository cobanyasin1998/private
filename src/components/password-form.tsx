"use client";

import { useState } from "react";

export function PasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError(""); setSaving(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/auth/password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(typeof result?.error === "string" ? result.error : "Şifre alanlarını kontrol edin."); return; }
      event.currentTarget.reset(); setMessage("Şifre değiştirildi. Diğer oturumlar kapatıldı.");
    } catch { setError("Şifre değiştirilemedi."); }
    finally { setSaving(false); }
  }
  return <section className="rounded-xl border bg-card p-5"><h2 className="font-medium">Hesap güvenliği</h2><p className="mt-1 text-sm text-muted-foreground">Şifreni değiştir. Diğer aktif oturumlar sonlandırılır.</p><form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-xs font-medium">Mevcut şifre<input required name="currentPassword" type="password" autoComplete="current-password" className="form-input" /></label><label className="text-xs font-medium">Yeni şifre<input required minLength={12} name="newPassword" type="password" autoComplete="new-password" className="form-input" /></label><label className="text-xs font-medium">Yeni şifre (tekrar)<input required minLength={12} name="confirmPassword" type="password" autoComplete="new-password" className="form-input" /></label><div className="sm:col-span-3 flex items-center gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">{saving ? "Kaydediliyor…" : "Şifreyi değiştir"}</button>{message && <span role="status" className="text-xs text-emerald-600">{message}</span>}{error && <span role="alert" className="text-xs text-rose-600">{error}</span>}</div></form></section>;
}
