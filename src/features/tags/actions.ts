"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity/events";
import { replaceEntityTags } from "./service";
import { tagAssignmentSchema, tagIdSchema, tagInputSchema } from "./schemas";

type Failure = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
type Success = { ok: true; id: string };
export type TagActionResult = Success | Failure;

function validationError(error: z.ZodError): Failure { return { ok: false, error: "Formu kontrol edin.", fieldErrors: error.flatten().fieldErrors }; }
function refresh() { revalidatePath("/settings/tags"); revalidatePath("/movies"); revalidatePath("/books"); revalidatePath("/courses"); }

export async function createTag(input: unknown): Promise<TagActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = tagInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const tag = await db.tag.create({ data: { ownerId: owner.id, name: parsed.data.name, color: parsed.data.color } }); await recordActivity(owner.id, { type: "tag.created", title: `Etiket oluşturuldu: ${tag.name}`, entityType: "tag", entityId: tag.id }); refresh(); return { ok: true, id: tag.id }; }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "Bu isimde bir etiket zaten var." }; return { ok: false, error: "Etiket kaydedilemedi." }; }
}

export async function updateTag(id: string, input: unknown): Promise<TagActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsedId = tagIdSchema.safeParse(id); if (!parsedId.success) return { ok: false, error: "Etiket bulunamadı." };
  const parsed = tagInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const result = await db.tag.updateMany({ where: { id: parsedId.data, ownerId: owner.id }, data: { name: parsed.data.name, color: parsed.data.color ?? null } }); if (!result.count) return { ok: false, error: "Etiket bulunamadı." }; await recordActivity(owner.id, { type: "tag.updated", title: `Etiket güncellendi: ${parsed.data.name}`, entityType: "tag", entityId: parsedId.data }); refresh(); return { ok: true, id: parsedId.data }; }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "Bu isimde bir etiket zaten var." }; return { ok: false, error: "Etiket güncellenemedi." }; }
}

export async function deleteTag(id: string): Promise<TagActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = tagIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Etiket bulunamadı." };
  const result = await db.tag.deleteMany({ where: { id: parsed.data, ownerId: owner.id } }); if (!result.count) return { ok: false, error: "Etiket bulunamadı." }; await recordActivity(owner.id, { type: "tag.deleted", title: "Etiket silindi", entityType: "tag", entityId: parsed.data }); refresh(); return { ok: true, id: parsed.data };
}

export async function assignTags(input: unknown): Promise<TagActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = tagAssignmentSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const { entityType, entityId, tagIds } = parsed.data;
  const entityExists = entityType === "movie" ? await db.movie.findFirst({ where: { id: entityId, ownerId: owner.id }, select: { id: true } }) : entityType === "book" ? await db.book.findFirst({ where: { id: entityId, ownerId: owner.id }, select: { id: true } }) : entityType === "course" ? await db.course.findFirst({ where: { id: entityId, ownerId: owner.id }, select: { id: true } }) : await db.note.findFirst({ where: { id: entityId, ownerId: owner.id }, select: { id: true } });
  if (!entityExists) return { ok: false, error: "Kayıt bulunamadı." };
  const ownedCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: tagIds } } }); if (ownedCount !== tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi." };
  await db.$transaction(async (tx) => replaceEntityTags(tx, entityType, entityId, tagIds));
  refresh();
  return { ok: true, id: entityId };
}

