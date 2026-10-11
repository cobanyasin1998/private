"use client";

import { useState } from "react";

type Preferences = { currency: string; timezone: string; weekStartsOn: number };

export function SettingsPreferences({ initial }: { initial: Preferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function save() {
    setSaving(true); setSaved(false);
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(preferences) });
    setSaving(false); setSaved(response.ok);
  }
  return <section className="rounded-xl border bg-card p-5"><h2 className="font-medium">Yerelleştirme</h2><p className="mt-1 text-sm text-muted-foreground">Türkçe tarih, saat ve para birimi tercihlerini kaydet.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Para birimi<select value={preferences.currency} onChange={(event) => setPreferences({ ...preferences, currency: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2 text-sm"><option>TRY</option><option>USD</option><option>EUR</option></select></label><label className="text-xs font-medium">Saat dilimi<select value={preferences.timezone} onChange={(event) => setPreferences({ ...preferences, timezone: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2 text-sm"><option>Europe/Istanbul</option><option>UTC</option></select></label></div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={save} disabled={saving} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">{saving ? "Kaydediliyor…" : "Ayarları kaydet"}</button>{saved && <span className="text-xs text-emerald-600">Kaydedildi</span>}</div></section>;
}
