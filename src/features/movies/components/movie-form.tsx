"use client";

import { TagPicker } from "@/components/tag-picker";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Film, Save } from "lucide-react";
import Link from "next/link";
import { createMovie, updateMovie, type MovieActionResult } from "../actions";
import { movieStatuses } from "../schemas";
import type { MovieListItem } from "../types";

const statusLabels: Record<(typeof movieStatuses)[number], string> = {
  PLANNED: "İzlenecek",
  WATCHING: "İzleniyor",
  COMPLETED: "Tamamlandı",
  DROPPED: "Bırakıldı",
};

type MovieFormProps = { mode: "create" | "edit"; movie?: MovieListItem; embedded?: boolean; onSuccess?: () => void; onCancel?: () => void };

export function MovieForm({ mode, movie, embedded = false, onSuccess, onCancel }: MovieFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    startTransition(async () => {
      const result: MovieActionResult = mode === "create" ? await createMovie(values) : await updateMovie(movie?.id ?? "", values);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.refresh();
      if (onSuccess) onSuccess();
      else router.push("/movies");
    });
  }

  const inputClass = "mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary";
  const initialRating = movie?.rating ?? "";
  return (
    <div className={embedded ? "space-y-5" : "mx-auto max-w-3xl space-y-7"}>
      <div>
        {!embedded && <Link href="/movies" className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={13} /> Filmlere dön</Link>}
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-primary/10 p-3 text-primary"><Film size={23} /></span>
          <div><p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">Film ve TV</p><h1 className="text-2xl font-semibold tracking-tight">{mode === "create" ? "Yeni film ekle" : "Filmi düzenle"}</h1><p className="mt-1 text-sm text-muted-foreground">İzleme kütüphanendeki bilgileri güncel tut.</p></div>
        </div>
      </div>
      <form onSubmit={submit} className={embedded ? "space-y-6" : "space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">Film adı *<input required name="title" defaultValue={movie?.title ?? ""} autoFocus className={inputClass} maxLength={200} />{fieldErrors.title?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.title[0]}</span>}</label>
          <label className="block text-sm font-medium">Yayın yılı<input name="releaseYear" type="number" min="1888" max="2200" defaultValue={movie?.releaseYear ?? ""} className={inputClass} />{fieldErrors.releaseYear?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.releaseYear[0]}</span>}</label>
          <label className="block text-sm font-medium">Süre (dakika)<input name="runtimeMins" type="number" min="1" max="2000" defaultValue={movie?.runtimeMins ?? ""} className={inputClass} />{fieldErrors.runtimeMins?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.runtimeMins[0]}</span>}</label>
          <label className="block text-sm font-medium">Durum<select name="status" defaultValue={movie?.status ?? "PLANNED"} className={inputClass}>{movieStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label>
          <label className="block text-sm font-medium">Puan <span className="font-normal text-muted-foreground">(0–10)</span><input name="rating" type="number" min="0" max="10" step="0.1" defaultValue={initialRating} className={inputClass} />{fieldErrors.rating?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.rating[0]}</span>}</label>
          <label className="block text-sm font-medium sm:col-span-2">Poster adresi <span className="font-normal text-muted-foreground">(isteğe bağlı)</span><input name="posterUrl" type="url" defaultValue={movie?.posterUrl ?? ""} placeholder="https://…" className={inputClass} />{fieldErrors.posterUrl?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.posterUrl[0]}</span>}</label>
          <label className="block text-sm font-medium sm:col-span-2">Yorum <span className="font-normal text-muted-foreground">(isteğe bağlı)</span><textarea name="review" defaultValue={movie?.review ?? ""} rows={5} maxLength={5000} className="mt-1.5 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary" placeholder="Bu film hakkında ne düşünüyorsun?" />{fieldErrors.review?.[0] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.review[0]}</span>}</label>
          <TagPicker initialTagIds={movie?.tagIds ?? []} />{fieldErrors.tagIds?.[0] && <p className="text-xs text-rose-600 sm:col-span-2">{fieldErrors.tagIds[0]}</p>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
        <div className="flex flex-col-reverse justify-end gap-2 border-t pt-5 sm:flex-row">{onCancel ? <button type="button" onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">Vazgeç</button> : <Link href="/movies" className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">Vazgeç</Link>}<button disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"><Save size={15} />{pending ? "Kaydediliyor…" : mode === "create" ? "Filmi kaydet" : "Değişiklikleri kaydet"}</button></div>
      </form>
    </div>
  );
}
