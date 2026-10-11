"use client";

import { useRouter } from "next/navigation";
import { Clapperboard, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { createSeries, updateSeries, type SeriesActionResult } from "../actions";
import { seriesStatuses } from "../schemas";
import type { SeriesListItem } from "../types";

const statusLabels: Record<(typeof seriesStatuses)[number], string> = { PLANNED: "İzlenecek", WATCHING: "İzleniyor", COMPLETED: "Tamamlandı", DROPPED: "Bırakıldı" };

export function SeriesForm({ mode, series, onSuccess, onCancel, embedded = false }: { mode: "create" | "edit"; series?: SeriesListItem; onSuccess?: () => void; onCancel?: () => void; embedded?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setFieldErrors({});
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    values.favorite = event.currentTarget.favorite.checked ? "true" : "false";
    startTransition(async () => {
      const result: SeriesActionResult = mode === "create" ? await createSeries(values) : await updateSeries(series?.id ?? "", values);
      if (!result.ok) { setError(result.error); setFieldErrors(result.fieldErrors ?? {}); return; }
      if (onSuccess) onSuccess(); else { router.push("/movies/tv"); router.refresh(); }
    });
  }
  const inputClass = "mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary";
  const title = mode === "create" ? "Yeni dizi ekle" : "Diziyi düzenle";
  const content = <form onSubmit={submit} className={embedded ? "space-y-6" : "space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"}><div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-medium sm:col-span-2">Dizi adı *<input required name="title" defaultValue={series?.title ?? ""} autoFocus className={inputClass} maxLength={200} />{fieldErrors.title?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.title[0]}</span>}</label>
      <label className="block text-sm font-medium">Yayın yılı<input name="releaseYear" type="number" min="1888" max="2200" defaultValue={series?.releaseYear ?? ""} className={inputClass} />{fieldErrors.releaseYear?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.releaseYear[0]}</span>}</label>
      <label className="block text-sm font-medium">Durum<select name="status" defaultValue={series?.status ?? "PLANNED"} className={inputClass}>{seriesStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label>
      <label className="block text-sm font-medium">Puan <span className="font-normal text-muted-foreground">(0–10)</span><input name="rating" type="number" min="0" max="10" step="0.1" defaultValue={series?.rating ?? ""} className={inputClass} />{fieldErrors.rating?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.rating[0]}</span>}</label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input name="favorite" type="checkbox" defaultChecked={series?.favorite ?? false} className="h-4 w-4 accent-primary" /> Favorilere ekle</label>
      <label className="block text-sm font-medium sm:col-span-2">Poster adresi <span className="font-normal text-muted-foreground">(isteğe bağlı)</span><input name="posterUrl" type="url" defaultValue={series?.posterUrl ?? ""} placeholder="https://…" className={inputClass} />{fieldErrors.posterUrl?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.posterUrl[0]}</span>}</label>
    </div>{error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>}<div className="flex flex-col-reverse justify-end gap-2 border-t pt-5 sm:flex-row">{(onCancel || embedded) && <button type="button" onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">Vazgeç</button>}<button disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"><Save size={15} />{pending ? "Kaydediliyor…" : mode === "create" ? "Diziyi kaydet" : "Değişiklikleri kaydet"}</button></div></form>;
  if (embedded) return content;
  return <div className="mx-auto max-w-3xl space-y-7"><div className="flex items-start gap-4"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Clapperboard size={23} /></span><div><p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">Film ve TV</p><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">Sezon ve bölüm ilerlemeni daha sonra dizi detayından takip edebilirsin.</p></div></div>{content}</div>;
}
