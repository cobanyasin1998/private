"use client";

import { TagFilter } from "@/components/tag-filter";
import { Modal } from "@/components/modal";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clapperboard, Edit3, Film, Heart, Plus, Search, Star, Trash2 } from "lucide-react";
import { deleteMovie, setMovieFavorite, setMovieStatus } from "../actions";
import { MovieForm } from "./movie-form";
import { movieStatuses } from "../schemas";
import type { MovieListItem, MovieStats } from "../types";

const statusLabels: Record<(typeof movieStatuses)[number], string> = { PLANNED: "İzlenecek", WATCHING: "İzleniyor", COMPLETED: "Tamamlandı", DROPPED: "Bırakıldı" };
const statusClasses: Record<(typeof movieStatuses)[number], string> = { PLANNED: "bg-muted text-muted-foreground", WATCHING: "bg-sky-500/10 text-sky-700 dark:text-sky-300", COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", DROPPED: "bg-rose-500/10 text-rose-700 dark:text-rose-300" };

type MovieLibraryProps = { movies: MovieListItem[]; stats: MovieStats; query?: string; tagId?: string; status?: string; favorite?: boolean };

export function MovieLibrary({ movies, stats, query = "", tagId = "", status = "", favorite = false }: MovieLibraryProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [formMovie, setFormMovie] = useState<MovieListItem | null | undefined>(undefined);

  function mutate(task: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await task();
      if (!result.ok) { setError(result.error ?? "İşlem gerçekleştirilemedi."); return; }
      window.location.reload();
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Kütüphane</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Film ve TV</h1><p className="mt-2 text-sm text-muted-foreground">İzlemek istediklerini, izlediklerini ve favorilerini tek yerde tut.</p></div><div className="flex flex-wrap gap-2"><Link href="/movies/tv" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"><Clapperboard size={16} /> Diziler</Link><button type="button" onClick={() => setFormMovie(null)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"><Plus size={16} /> Film ekle</button></div></header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Toplam film" value={stats.total} /><Stat label="İzleniyor" value={stats.watching} tone="sky" /><Stat label="Tamamlanan" value={stats.completed} tone="emerald" /><Stat label="Favoriler" value={stats.favorites} tone="rose" /></section>
      <form method="get" className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><label className="relative min-w-0 flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Film ara</span><input name="q" defaultValue={query} placeholder="Film adına göre ara…" className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></label><select aria-label="Duruma göre filtrele" name="status" defaultValue={status} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"><option value="">Tüm durumlar</option>{movieStatuses.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</select><label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground"><input type="checkbox" name="favorite" value="1" defaultChecked={favorite} className="accent-primary" /> Sadece favoriler</label><TagFilter value={tagId} /><button className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted">Filtrele</button>{(query || status || favorite || tagId) && <Link href="/movies" className="text-center text-xs text-muted-foreground hover:text-foreground sm:px-2">Temizle</Link>}</form>
      {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {movies.length === 0 ? <EmptyState filtered={Boolean(query || status || favorite || tagId)} onAdd={() => setFormMovie(null)} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} pending={pending} onFavorite={() => mutate(() => setMovieFavorite({ id: movie.id, favorite: !movie.favorite }))} onStatus={(nextStatus) => mutate(() => setMovieStatus({ id: movie.id, status: nextStatus }))} onEdit={() => setFormMovie(movie)} onDelete={() => { if (window.confirm(`“${movie.title}” silinsin mi?`)) mutate(() => deleteMovie(movie.id)); }} />)}</div>}
      <Modal open={formMovie !== undefined} title={formMovie ? "Filmi düzenle" : "Yeni film ekle"} onClose={() => setFormMovie(undefined)}><MovieForm mode={formMovie ? "edit" : "create"} movie={formMovie ?? undefined} embedded onCancel={() => setFormMovie(undefined)} onSuccess={() => setFormMovie(undefined)} /></Modal>
    </div>
  );
}

function Stat({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "sky" | "emerald" | "rose" }) {
  const tones = { primary: "text-primary", sky: "text-sky-600 dark:text-sky-400", emerald: "text-emerald-600 dark:text-emerald-400", rose: "text-rose-600 dark:text-rose-400" };
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-semibold tracking-tight ${tones[tone]}`}>{value}</p></div>;
}

function EmptyState({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  return <div className="rounded-2xl border border-dashed bg-card p-10 text-center sm:p-16"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Film size={22} /></span><h2 className="text-lg font-semibold">{filtered ? "Eşleşen film bulunamadı" : "Kütüphanen henüz boş"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{filtered ? "Filtrelerini değiştirerek tekrar deneyebilir veya yeni bir film ekleyebilirsin." : "İlk filmini ekle, izleme durumunu ve puanını burada takip et."}</p>{!filtered && <button type="button" onClick={onAdd} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus size={15} /> İlk filmi ekle</button>}</div>;
}

function MovieCard({ movie, pending, onFavorite, onStatus, onEdit, onDelete }: { movie: MovieListItem; pending: boolean; onFavorite: () => void; onStatus: (status: (typeof movieStatuses)[number]) => void; onEdit: () => void; onDelete: () => void }) {
  return <article className="group overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(15,23,42,.03)] transition hover:border-primary/30 hover:shadow-sm"><div className="flex min-h-36 gap-4 p-4"><div className="relative flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{movie.posterUrl ? <Image src={movie.posterUrl} alt={`${movie.title} posteri`} width={96} height={128} unoptimized className="h-full w-full object-cover" /> : <Film size={24} className="text-muted-foreground/50" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate font-semibold" title={movie.title}>{movie.title}</h2><p className="mt-1 text-xs text-muted-foreground">{[movie.releaseYear, movie.runtimeMins ? `${movie.runtimeMins} dk` : null].filter(Boolean).join(" · ") || "Yıl ve süre eklenmedi"}</p></div><button type="button" disabled={pending} onClick={onFavorite} aria-label={movie.favorite ? "Favoriden çıkar" : "Favorilere ekle"} className={`shrink-0 rounded-md p-1.5 transition hover:bg-muted ${movie.favorite ? "text-rose-500" : "text-muted-foreground"}`}><Heart size={17} fill={movie.favorite ? "currentColor" : "none"} /></button></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusClasses[movie.status]}`}>{statusLabels[movie.status]}</span>{movie.rating !== null && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star size={13} className="text-amber-500" fill="currentColor" /> {movie.rating}</span>}</div>{movie.review && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{movie.review}</p>}</div></div><div className="flex items-center gap-2 border-t bg-muted/20 px-4 py-3"><label className="sr-only" htmlFor={`status-${movie.id}`}>Durum</label><select id={`status-${movie.id}`} disabled={pending} value={movie.status} onChange={(event) => onStatus(event.target.value as (typeof movieStatuses)[number])} className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary">{movieStatuses.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</select><button type="button" onClick={onEdit} aria-label={`${movie.title} düzenle`} className="inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-xs font-medium hover:bg-muted"><Edit3 size={13} /></button><button type="button" disabled={pending} onClick={onDelete} aria-label={`${movie.title} sil`} className="inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-xs text-rose-600 hover:bg-rose-500/10"><Trash2 size={13} /></button></div></article>;
}
