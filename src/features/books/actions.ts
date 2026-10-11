"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity/events";
import { bookFavoriteInputSchema, bookIdSchema, bookInputSchema, bookProgressInputSchema, bookStatusInputSchema, readingSessionInputSchema } from "./schemas";

type ActionSuccess = { ok: true; bookId: string };
type ActionFailure = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
export type BookActionResult = ActionSuccess | ActionFailure;

function validationError(error: z.ZodError): ActionFailure {
  return { ok: false, error: "Formu kontrol edin.", fieldErrors: error.flatten().fieldErrors };
}

function refreshBook(bookId?: string) {
  revalidatePath("/books");
  revalidatePath("/dashboard");
  if (bookId) revalidatePath(`/books/${bookId}/edit`);
}

export async function createBook(input: unknown): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = bookInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const tagCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: parsed.data.tagIds } } });
  if (tagCount !== parsed.data.tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi.", fieldErrors: { tagIds: ["Etiketler bulunamadı."] } };
  try {
    const book = await db.book.create({ data: {
      ownerId: owner.id,
      tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
      title: parsed.data.title,
      author: parsed.data.author,
      isbn: parsed.data.isbn,
      coverUrl: parsed.data.coverUrl,
      pageCount: parsed.data.pageCount,
      currentPage: parsed.data.currentPage ?? 0,
      genre: parsed.data.genre,
      description: parsed.data.description,
      publisher: parsed.data.publisher,
      publicationYear: parsed.data.publicationYear,
      rating: parsed.data.rating === undefined ? undefined : new Prisma.Decimal(parsed.data.rating),
      review: parsed.data.review,
      status: parsed.data.status,
      startedAt: parsed.data.status === "READING" || parsed.data.status === "COMPLETED" || Boolean(parsed.data.currentPage) ? new Date() : undefined,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined,
    } });
    await recordActivity(owner.id, { type: "book.created", title: `Kitap eklendi: ${book.title}`, entityType: "book", entityId: book.id });
    refreshBook();
    return { ok: true, bookId: book.id };
  } catch {
    return { ok: false, error: "Kitap kaydedilemedi. Lütfen tekrar deneyin." };
  }
}

export async function updateBook(id: string, input: unknown): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsedId = bookIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Kitap bulunamadı." };
  const parsed = bookInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const tagCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: parsed.data.tagIds } } });
  if (tagCount !== parsed.data.tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi.", fieldErrors: { tagIds: ["Etiketler bulunamadı."] } };
  const existing = await db.book.findFirst({ where: { id: parsedId.data, ownerId: owner.id }, select: { id: true, status: true, currentPage: true, pageCount: true, startedAt: true, completedAt: true } });
  if (!existing) return { ok: false, error: "Kitap bulunamadı." };
  const effectivePageCount = parsed.data.pageCount ?? existing.pageCount;
  const effectiveCurrentPage = parsed.data.currentPage ?? existing.currentPage;
  if (effectivePageCount !== null && effectiveCurrentPage > effectivePageCount) {
    return { ok: false, error: "Mevcut sayfa toplam sayfadan büyük olamaz.", fieldErrors: { currentPage: ["Mevcut sayfa toplam sayfadan büyük olamaz."] } };
  }
  try {
    await db.book.update({ where: { id: existing.id }, data: {
      tags: { deleteMany: {}, create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
      title: parsed.data.title,
      author: parsed.data.author,
      isbn: parsed.data.isbn,
      coverUrl: parsed.data.coverUrl,
      pageCount: parsed.data.pageCount,
      ...(parsed.data.currentPage === undefined ? {} : { currentPage: parsed.data.currentPage }),
      genre: parsed.data.genre,
      description: parsed.data.description,
      publisher: parsed.data.publisher,
      publicationYear: parsed.data.publicationYear,
      rating: parsed.data.rating === undefined ? null : new Prisma.Decimal(parsed.data.rating),
      review: parsed.data.review,
      status: parsed.data.status,
      startedAt: parsed.data.status === "WANT_TO_READ" ? null : existing.startedAt ?? new Date(),
      completedAt: parsed.data.status === "COMPLETED" ? existing.completedAt ?? new Date() : null,
    } });
    refreshBook(existing.id);
    return { ok: true, bookId: existing.id };
  } catch {
    return { ok: false, error: "Kitap güncellenemedi. Lütfen tekrar deneyin." };
  }
}

export async function deleteBook(id: string): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = bookIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Kitap bulunamadı." };
  const deleted = await db.book.deleteMany({ where: { id: parsed.data, ownerId: owner.id } });
  if (deleted.count === 0) return { ok: false, error: "Kitap bulunamadı." };
  refreshBook();
  return { ok: true, bookId: parsed.data };
}

export async function setBookStatus(input: unknown): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = bookStatusInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz kitap durumu." };
  const existing = await db.book.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, startedAt: true, completedAt: true } });
  if (!existing) return { ok: false, error: "Kitap bulunamadı." };
  try {
    await db.book.update({ where: { id: existing.id }, data: {
      status: parsed.data.status,
      startedAt: parsed.data.status === "WANT_TO_READ" ? null : existing.startedAt ?? new Date(),
      completedAt: parsed.data.status === "COMPLETED" ? existing.completedAt ?? new Date() : null,
    } });
  } catch {
    return { ok: false, error: "Kitap durumu güncellenemedi. Lütfen tekrar deneyin." };
  }
  refreshBook(existing.id);
  return { ok: true, bookId: existing.id };
}

export async function setBookFavorite(input: unknown): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = bookFavoriteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz favori işlemi." };
  const updated = await db.book.updateMany({ where: { id: parsed.data.id, ownerId: owner.id }, data: { favorite: parsed.data.favorite } });
  if (updated.count === 0) return { ok: false, error: "Kitap bulunamadı." };
  refreshBook(parsed.data.id);
  return { ok: true, bookId: parsed.data.id };
}

export async function setBookProgress(input: unknown): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = bookProgressInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz okuma ilerlemesi." };
  const existing = await db.book.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, pageCount: true, status: true, startedAt: true } });
  if (!existing) return { ok: false, error: "Kitap bulunamadı." };
  if (existing.pageCount !== null && parsed.data.currentPage > existing.pageCount) return { ok: false, error: "Mevcut sayfa toplam sayfadan büyük olamaz." };
  const completed = existing.pageCount !== null && parsed.data.currentPage >= existing.pageCount;
  try {
    await db.book.update({ where: { id: existing.id }, data: {
      currentPage: parsed.data.currentPage,
      status: completed ? "COMPLETED" : (parsed.data.currentPage > 0 && (existing.status === "WANT_TO_READ" || existing.status === "COMPLETED") ? "READING" : existing.status),
      startedAt: parsed.data.currentPage > 0 ? existing.startedAt ?? new Date() : null,
      completedAt: completed ? new Date() : null,
    } });
  } catch {
    return { ok: false, error: "Okuma ilerlemesi güncellenemedi. Lütfen tekrar deneyin." };
  }
  refreshBook(existing.id);
  return { ok: true, bookId: existing.id };
}

export async function createReadingSession(input: unknown): Promise<BookActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = readingSessionInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const book = await db.book.findFirst({ where: { id: parsed.data.bookId, ownerId: owner.id }, select: { id: true, currentPage: true, pageCount: true, status: true, startedAt: true } });
  if (!book) return { ok: false, error: "Kitap bulunamadı." };
  const nextPage = book.pageCount === null ? book.currentPage + parsed.data.pagesRead : Math.min(book.pageCount, book.currentPage + parsed.data.pagesRead);
  const completed = book.pageCount !== null && nextPage >= book.pageCount;
  const startedAt = parsed.data.startedAt ?? parsed.data.endedAt ?? new Date();
  try {
    await db.$transaction([
      db.readingSession.create({ data: { bookId: book.id, startedAt, endedAt: parsed.data.endedAt, pagesRead: parsed.data.pagesRead, note: parsed.data.note } }),
      db.book.update({ where: { id: book.id }, data: { currentPage: nextPage, status: completed ? "COMPLETED" : (nextPage > 0 && book.status === "WANT_TO_READ" ? "READING" : book.status), startedAt: nextPage > 0 ? book.startedAt ?? startedAt : null, completedAt: completed ? new Date() : null } }),
    ]);
  } catch {
    return { ok: false, error: "Okuma oturumu kaydedilemedi. Lütfen tekrar deneyin." };
  }
  refreshBook(book.id);
  return { ok: true, bookId: book.id };
}
