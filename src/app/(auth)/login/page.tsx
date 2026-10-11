"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    if (response.ok) { const next = new URLSearchParams(window.location.search).get("next"); window.location.assign(next?.startsWith("/") ? next : "/dashboard"); } else { setError("E-posta veya parola hatalı."); setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><div className="w-full max-w-sm"><div className="mb-8 text-center"><span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">P</span><h1 className="text-2xl font-semibold">Tekrar hoş geldin</h1><p className="mt-2 text-sm text-muted-foreground">Kişisel Yaşam OS alanına giriş yap.</p></div><form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"><label className="block text-sm font-medium">E-posta<input required name="email" type="email" autoComplete="email" className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /></label><label className="block text-sm font-medium">Parola<input required name="password" type="password" autoComplete="current-password" className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /></label>{error && <p className="text-sm text-rose-600" role="alert">{error}</p>}<button disabled={busy} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"><LockKeyhole size={15} />{busy ? "Giriş yapılıyor…" : "Giriş yap"}</button></form><p className="mt-5 text-center text-xs text-muted-foreground">İlk kurulum için <Link href="/setup" className="text-primary hover:underline">kurulum sayfasını</Link> kullan.</p></div></main>;
}
