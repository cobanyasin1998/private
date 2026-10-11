"use client";

import { TagFilter } from "@/components/tag-filter";
import { Modal } from "@/components/modal";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Edit3, Heart, Plus, Search, Star, Trash2 } from "lucide-react";
import { createReadingSession, deleteBook, setBookFavorite, setBookProgress, setBookStatus } from "../actions";
import { BookForm } from "./book-form";
import { readingStatuses } from "../schemas";
import type { BookListItem, BookStats } from "../types";

const statusLabels: Record<(typeof readingStatuses)[number], string> = { WANT_TO_READ: "Okunacak", READING: "Okunuyor", COMPLETED: "Tamamlandı", PAUSED: "Beklemede", DROPPED: "Bırakıldı" };
const statusClasses: Record<(typeof readingStatuses)[number], string> = { WANT_TO_READ: "bg-muted text-muted-foreground", READING: "bg-sky-500/10 text-sky-700 dark:text-sky-300", COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", PAUSED: "bg-amber-500/10 text-amber-700 dark:text-amber-300", DROPPED: "bg-rose-500/10 text-rose-700 dark:text-rose-300" };

type BookLibraryProps = { books: BookListItem[]; stats: BookStats; query?: string; tagId?: string; status?: string; favorite?: boolean };

export function BookLibrary({ books, stats, query = "", tagId = "", status = "", favorite = false }: BookLibraryProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [formBook, setFormBook] = useState<BookListItem | null | undefined>(undefined);

  function mutate(task: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await task();
      if (!result.ok) { setError(result.error ?? "İşlem gerçekleştirilemedi."); return; }
      window.location.reload();
    });
  }

  return <div className="mx-auto max-w-[1440px] space-y-7">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Kütüphane</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Kitaplar</h1><p className="mt-2 text-sm text-muted-foreground">Okumak istediklerini, devam ettiklerini ve bitirdiklerini takip et.</p></div><button type="button" onClick={() => setFormBook(null)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"><Plus size={16} /> Kitap ekle</button></header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Toplam kitap" value={stats.total} /><Stat label="Okunuyor" value={stats.reading} tone="sky" /><Stat label="Tamamlanan" value={stats.completed} tone="emerald" /><Stat label="Favoriler" value={stats.favorites} tone="rose" /><Stat label="Okunan sayfa" value={stats.pagesRead} tone="violet" /></section>
    <form method="get" className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><label className="relative min-w-0 flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Kitap ara</span><input name="q" defaultValue={query} placeholder="Kitap, yazar veya ISBN ara…" className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></label><select aria-label="Duruma göre filtrele" name="status" defaultValue={status} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"><option value="">Tüm durumlar</option>{readingStatuses.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</select><label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground"><input type="checkbox" name="favorite" value="1" defaultChecked={favorite} className="accent-primary" /> Sadece favoriler</label><TagFilter value={tagId} /><button className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted">Filtrele</button>{(query || status || favorite || tagId) && <Link href="/books" className="text-center text-xs text-muted-foreground hover:text-foreground sm:px-2">Temizle</Link>}</form>
    {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    {books.length === 0 ? <EmptyState filtered={Boolean(query || status || favorite || tagId)} onAdd={() => setFormBook(null)} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{books.map((book) => <BookCard key={book.id} book={book} pending={pending} onFavorite={() => mutate(() => setBookFavorite({ id: book.id, favorite: !book.favorite }))} onStatus={(nextStatus) => mutate(() => setBookStatus({ id: book.id, status: nextStatus }))} onProgress={(currentPage) => mutate(() => setBookProgress({ id: book.id, currentPage }))} onSession={(pagesRead, note) => mutate(() => createReadingSession({ bookId: book.id, pagesRead, note }))} onEdit={() => setFormBook(book)} onDelete={() => { if (window.confirm(`“${book.title}” silinsin mi?`)) mutate(() => deleteBook(book.id)); }} />)}</div>}
    <Modal open={formBook !== undefined} title={formBook ? "Kitabı düzenle" : "Yeni kitap ekle"} onClose={() => setFormBook(undefined)}><BookForm mode={formBook ? "edit" : "create"} book={formBook ?? undefined} embedded onCancel={() => setFormBook(undefined)} onSuccess={() => setFormBook(undefined)} /></Modal>
  </div>;
}

function Stat({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "sky" | "emerald" | "rose" | "violet" }) {
  const tones = { primary: "text-primary", sky: "text-sky-600 dark:text-sky-400", emerald: "text-emerald-600 dark:text-emerald-400", rose: "text-rose-600 dark:text-rose-400", violet: "text-violet-600 dark:text-violet-400" };
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-semibold tracking-tight ${tones[tone]}`}>{value.toLocaleString("tr-TR")}</p></div>;
}

function EmptyState({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  return <div className="rounded-2xl border border-dashed bg-card p-10 text-center sm:p-16"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><BookOpen size={22} /></span><h2 className="text-lg font-semibold">{filtered ? "Eşleşen kitap bulunamadı" : "Kütüphanen henüz boş"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{filtered ? "Filtrelerini değiştirerek tekrar deneyebilir veya yeni bir kitap ekleyebilirsin." : "İlk kitabını ekle, okuma durumunu ve ilerlemeni burada takip et."}</p>{!filtered && <button type="button" onClick={onAdd} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus size={15} /> İlk kitabı ekle</button>}</div>;
}

function BookCard({ book, pending, onFavorite, onStatus, onProgress, onSession, onEdit, onDelete }: { book: BookListItem; pending: boolean; onFavorite: () => void; onStatus: (status: (typeof readingStatuses)[number]) => void; onProgress: (page: number) => void; onSession: (pages: number, note: string) => void; onEdit: () => void; onDelete: () => void }) {
  const [page, setPage] = useState(book.currentPage);
  const [sessionPages, setSessionPages] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const percent = book.pageCount ? Math.min(100, Math.round((book.currentPage / book.pageCount) * 100)) : null;
  function submitSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pages = Number(sessionPages);
    if (!Number.isFinite(pages) || pages < 0) return;
    onSession(pages, sessionNote);
    setSessionPages("");
    setSessionNote("");
  }
  return <article className="group overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(15,23,42,.03)] transition hover:border-primary/30 hover:shadow-sm"><div className="flex min-h-40 gap-4 p-4"><div className="relative flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{book.coverUrl ? <Image src={book.coverUrl} alt={`${book.title} kapağı`} className="object-cover" fill sizes="96px" unoptimized /> : <BookOpen size={25} className="text-muted-foreground/50" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate font-semibold" title={book.title}>{book.title}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{book.author || "Yazar eklenmedi"}{book.publicationYear ? ` · ${book.publicationYear}` : ""}</p></div><button type="button" disabled={pending} onClick={onFavorite} aria-label={book.favorite ? "Favoriden çıkar" : "Favorilere ekle"} className={`shrink-0 rounded-md p-1.5 transition hover:bg-muted ${book.favorite ? "text-rose-500" : "text-muted-foreground"}`}><Heart size={17} fill={book.favorite ? "currentColor" : "none"} /></button></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusClasses[book.status]}`}>{statusLabels[book.status]}</span>{book.rating !== null && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star size={13} className="text-amber-500" fill="currentColor" /> {book.rating}</span>}{book.genre && <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{book.genre}</span>}</div>{book.pageCount ? <div className="mt-4"><div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground"><span>Okuma ilerlemesi</span><span>{book.currentPage.toLocaleString("tr-TR")} / {book.pageCount.toLocaleString("tr-TR")} sf. ({percent}%)</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div></div> : <p className="mt-4 text-xs text-muted-foreground">Sayfa sayısı eklenmedi</p>}</div></div><div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-3"><label className="sr-only" htmlFor={`progress-${book.id}`}>Mevcut sayfa</label><input id={`progress-${book.id}`} type="number" min="0" max={book.pageCount ?? 100000} value={page} onChange={(event) => setPage(Number(event.target.value))} disabled={pending} className="h-8 w-24 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" /><button type="button" disabled={pending || page === book.currentPage} onClick={() => onProgress(page)} className="h-8 rounded-md border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50">İlerlemeyi kaydet</button><select aria-label="Kitap durumu" disabled={pending} value={book.status} onChange={(event) => onStatus(event.target.value as (typeof readingStatuses)[number])} className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary">{readingStatuses.map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</select><button type="button" onClick={onEdit} aria-label={`${book.title} düzenle`} className="inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-xs font-medium hover:bg-muted"><Edit3 size={13} /></button><button type="button" disabled={pending} onClick={onDelete} aria-label={`${book.title} sil`} className="inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-xs text-rose-600 hover:bg-rose-500/10"><Trash2 size={13} /></button></div><details className="border-t px-4 py-3"><summary className="cursor-pointer text-xs font-medium text-muted-foreground">Okuma oturumu ekle</summary><form onSubmit={submitSession} className="mt-3 space-y-2"><div className="flex gap-2"><input required type="number" min="0" max="100000" value={sessionPages} onChange={(event) => setSessionPages(event.target.value)} placeholder="Okunan sayfa" className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" /><button disabled={pending} className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50">Ekle</button></div><input value={sessionNote} onChange={(event) => setSessionNote(event.target.value)} placeholder="Kısa not (isteğe bağlı)" maxLength={2000} className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" /></form></details></article>;
}
