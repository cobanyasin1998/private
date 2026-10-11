"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity/events";
import { movieFavoriteInputSchema, movieIdSchema, movieInputSchema, movieStatusInputSchema } from "./schemas";

type ActionSuccess = { ok: true; movieId: string };
type ActionFailure = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
export type MovieActionResult = ActionSuccess | ActionFailure;

function validationError(error: z.ZodError): ActionFailure {
  return { ok: false, error: "Formu kontrol edin.", fieldErrors: error.flatten().fieldErrors };
}

export async function createMovie(input: unknown): Promise<MovieActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = movieInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const tagCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: parsed.data.tagIds } } });
  if (tagCount !== parsed.data.tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi.", fieldErrors: { tagIds: ["Etiketler bulunamadı."] } };
  try {
    const movie = await db.movie.create({
      data: {
        ownerId: owner.id,
        tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
        title: parsed.data.title,
        releaseYear: parsed.data.releaseYear,
        runtimeMins: parsed.data.runtimeMins,
        posterUrl: parsed.data.posterUrl,
        status: parsed.data.status,
        rating: parsed.data.rating === undefined ? undefined : new Prisma.Decimal(parsed.data.rating),
        review: parsed.data.review,
        watchedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined,
      },
    });
    await recordActivity(owner.id, { type: "movie.created", title: `Film eklendi: ${movie.title}`, entityType: "movie", entityId: movie.id });
    revalidatePath("/movies");
    revalidatePath("/dashboard");
    return { ok: true, movieId: movie.id };
  } catch {
    return { ok: false, error: "Film kaydedilemedi. Lütfen tekrar deneyin." };
  }
}

export async function updateMovie(id: string, input: unknown): Promise<MovieActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsedId = movieIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Film bulunamadı." };
  const parsed = movieInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const tagCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: parsed.data.tagIds } } });
  if (tagCount !== parsed.data.tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi.", fieldErrors: { tagIds: ["Etiketler bulunamadı."] } };
  const existing = await db.movie.findFirst({ where: { id: parsedId.data, ownerId: owner.id }, select: { id: true, status: true } });
  if (!existing) return { ok: false, error: "Film bulunamadı." };
  try {
    await db.movie.update({
      where: { id: existing.id },
      data: {
        tags: { deleteMany: {}, create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
        title: parsed.data.title,
        releaseYear: parsed.data.releaseYear,
        runtimeMins: parsed.data.runtimeMins,
        posterUrl: parsed.data.posterUrl,
        status: parsed.data.status,
        rating: parsed.data.rating === undefined ? null : new Prisma.Decimal(parsed.data.rating),
        review: parsed.data.review,
        watchedAt: parsed.data.status === "COMPLETED" ? (existing.status === "COMPLETED" ? undefined : new Date()) : null,
      },
    });
    revalidatePath("/movies");
    revalidatePath(`/movies/${existing.id}/edit`);
    revalidatePath("/dashboard");
    return { ok: true, movieId: existing.id };
  } catch {
    return { ok: false, error: "Film güncellenemedi. Lütfen tekrar deneyin." };
  }
}

export async function deleteMovie(id: string): Promise<MovieActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = movieIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Film bulunamadı." };
  const deleted = await db.movie.deleteMany({ where: { id: parsed.data, ownerId: owner.id } });
  if (deleted.count === 0) return { ok: false, error: "Film bulunamadı." };
  revalidatePath("/movies");
  revalidatePath("/dashboard");
  return { ok: true, movieId: parsed.data };
}

export async function setMovieStatus(input: unknown): Promise<MovieActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = movieStatusInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz film durumu." };
  const updated = await db.movie.updateMany({
    where: { id: parsed.data.id, ownerId: owner.id },
    data: { status: parsed.data.status, watchedAt: parsed.data.status === "COMPLETED" ? new Date() : null },
  });
  if (updated.count === 0) return { ok: false, error: "Film bulunamadı." };
  revalidatePath("/movies");
  revalidatePath(`/movies/${parsed.data.id}/edit`);
  revalidatePath("/dashboard");
  return { ok: true, movieId: parsed.data.id };
}

export async function setMovieFavorite(input: unknown): Promise<MovieActionResult> {
  const owner = await getSessionOwner();
  if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = movieFavoriteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz favori işlemi." };
  const updated = await db.movie.updateMany({ where: { id: parsed.data.id, ownerId: owner.id }, data: { favorite: parsed.data.favorite } });
  if (updated.count === 0) return { ok: false, error: "Film bulunamadı." };
  revalidatePath("/movies");
  revalidatePath(`/movies/${parsed.data.id}/edit`);
  return { ok: true, movieId: parsed.data.id };
}
