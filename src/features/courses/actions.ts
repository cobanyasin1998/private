"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity/events";
import { courseGoalCompletionSchema, courseGoalDeleteSchema, courseGoalInputSchema, courseGoalUpdateSchema, courseIdSchema, courseInputSchema, courseLessonCompletionSchema, courseLessonDeleteSchema, courseLessonInputSchema, courseLessonUpdateSchema, courseNoteDeleteSchema, courseNoteInputSchema, courseNoteUpdateSchema, courseProgressInputSchema, courseStatusInputSchema, studySessionDeleteSchema, studySessionInputSchema } from "./schemas";

type ActionSuccess = { ok: true; courseId: string };
type ActionFailure = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
export type CourseActionResult = ActionSuccess | ActionFailure;
function validationError(error: z.ZodError): ActionFailure { return { ok: false, error: "Formu kontrol edin.", fieldErrors: error.flatten().fieldErrors }; }
function refresh(courseId?: string) { revalidatePath("/courses"); revalidatePath("/dashboard"); if (courseId) revalidatePath(`/courses/${courseId}/edit`); }

export async function createCourse(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const tagCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: parsed.data.tagIds } } });
  if (tagCount !== parsed.data.tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi.", fieldErrors: { tagIds: ["Etiketler bulunamadı."] } };
  const progress = parsed.data.status === "COMPLETED" ? 100 : parsed.data.progress ?? 0;
  try { const course = await db.course.create({ data: { ownerId: owner.id, tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) }, name: parsed.data.name, category: parsed.data.category, description: parsed.data.description, provider: parsed.data.provider, externalUrl: parsed.data.externalUrl, status: parsed.data.status, progress, startedAt: parsed.data.status === "PLANNED" ? undefined : new Date(), completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined } }); await recordActivity(owner.id, { type: "course.created", title: `Kurs eklendi: ${course.name}`, entityType: "course", entityId: course.id }); refresh(); return { ok: true, courseId: course.id }; } catch { return { ok: false, error: "Kurs kaydedilemedi. Lütfen tekrar deneyin." }; }
}

export async function updateCourse(id: string, input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsedId = courseIdSchema.safeParse(id); if (!parsedId.success) return { ok: false, error: "Kurs bulunamadı." };
  const parsed = courseInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const tagCount = await db.tag.count({ where: { ownerId: owner.id, id: { in: parsed.data.tagIds } } });
  if (tagCount !== parsed.data.tagIds.length) return { ok: false, error: "Geçersiz etiket seçimi.", fieldErrors: { tagIds: ["Etiketler bulunamadı."] } };
  const existing = await db.course.findFirst({ where: { id: parsedId.data, ownerId: owner.id }, select: { id: true, status: true, startedAt: true, completedAt: true } }); if (!existing) return { ok: false, error: "Kurs bulunamadı." };
  const progress = parsed.data.status === "COMPLETED" ? 100 : parsed.data.progress ?? 0;
  try { await db.course.update({ where: { id: existing.id }, data: { tags: { deleteMany: {}, create: parsed.data.tagIds.map((tagId) => ({ tagId })) }, name: parsed.data.name, category: parsed.data.category, description: parsed.data.description, provider: parsed.data.provider, externalUrl: parsed.data.externalUrl, status: parsed.data.status, progress, startedAt: parsed.data.status === "PLANNED" ? null : existing.startedAt ?? new Date(), completedAt: parsed.data.status === "COMPLETED" ? existing.completedAt ?? new Date() : null } }); refresh(existing.id); return { ok: true, courseId: existing.id }; } catch { return { ok: false, error: "Kurs güncellenemedi. Lütfen tekrar deneyin." }; }
}

export async function deleteCourse(id: string): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Kurs bulunamadı." }; const deleted = await db.course.deleteMany({ where: { id: parsed.data, ownerId: owner.id } }); if (!deleted.count) return { ok: false, error: "Kurs bulunamadı." }; refresh(); return { ok: true, courseId: parsed.data }; }

export async function setCourseStatus(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseStatusInputSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Geçersiz kurs durumu." }; const existing = await db.course.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, progress: true, startedAt: true, completedAt: true } }); if (!existing) return { ok: false, error: "Kurs bulunamadı." }; try { await db.course.update({ where: { id: existing.id }, data: { status: parsed.data.status, progress: parsed.data.status === "COMPLETED" ? 100 : existing.progress, startedAt: parsed.data.status === "PLANNED" ? null : existing.startedAt ?? new Date(), completedAt: parsed.data.status === "COMPLETED" ? existing.completedAt ?? new Date() : null } }); refresh(existing.id); return { ok: true, courseId: existing.id }; } catch { return { ok: false, error: "Kurs durumu güncellenemedi." }; } }

export async function setCourseProgress(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseProgressInputSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "İlerleme 0 ile 100 arasında olmalı." }; const existing = await db.course.findFirst({ where: { id: parsed.data.id, ownerId: owner.id }, select: { id: true, status: true, startedAt: true } }); if (!existing) return { ok: false, error: "Kurs bulunamadı." }; const completed = parsed.data.progress >= 100; try { await db.course.update({ where: { id: existing.id }, data: { progress: parsed.data.progress, status: completed ? "COMPLETED" : existing.status === "PLANNED" || existing.status === "COMPLETED" ? "IN_PROGRESS" : existing.status, startedAt: parsed.data.progress > 0 ? existing.startedAt ?? new Date() : null, completedAt: completed ? new Date() : null } }); refresh(existing.id); return { ok: true, courseId: existing.id }; } catch { return { ok: false, error: "Kurs ilerlemesi güncellenemedi." }; } }

export async function createCourseLesson(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseLessonInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error); const course = await db.course.findFirst({ where: { id: parsed.data.courseId, ownerId: owner.id }, select: { id: true } }); if (!course) return { ok: false, error: "Kurs bulunamadı." }; const max = await db.courseLesson.aggregate({ where: { courseId: course.id }, _max: { position: true } }); const position = parsed.data.position ?? ((max._max.position ?? 0) + 1); try { await db.courseLesson.create({ data: { courseId: course.id, title: parsed.data.title, position, notes: parsed.data.notes } }); refresh(course.id); return { ok: true, courseId: course.id }; } catch { return { ok: false, error: "Ders eklenemedi. Sıra numarası çakışıyor olabilir." }; } }

export async function updateCourseLesson(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseLessonUpdateSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error); const lesson = await db.courseLesson.findFirst({ where: { id: parsed.data.id, course: { ownerId: owner.id } }, select: { id: true, courseId: true } }); if (!lesson) return { ok: false, error: "Ders bulunamadı." }; try { await db.courseLesson.update({ where: { id: lesson.id }, data: { title: parsed.data.title, notes: parsed.data.notes } }); refresh(lesson.courseId); return { ok: true, courseId: lesson.courseId }; } catch { return { ok: false, error: "Ders güncellenemedi." }; } }

export async function setCourseLessonCompleted(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseLessonCompletionSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Geçersiz ders işlemi." }; const lesson = await db.courseLesson.findFirst({ where: { id: parsed.data.id, course: { ownerId: owner.id } }, select: { id: true, courseId: true } }); if (!lesson) return { ok: false, error: "Ders bulunamadı." }; try { await db.courseLesson.update({ where: { id: lesson.id }, data: { completedAt: parsed.data.completed ? new Date() : null } }); refresh(lesson.courseId); return { ok: true, courseId: lesson.courseId }; } catch { return { ok: false, error: "Ders durumu güncellenemedi." }; } }

export async function deleteCourseLesson(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = courseLessonDeleteSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Ders bulunamadı." }; const lesson = await db.courseLesson.findFirst({ where: { id: parsed.data.id, course: { ownerId: owner.id } }, select: { id: true, courseId: true } }); if (!lesson) return { ok: false, error: "Ders bulunamadı." }; await db.courseLesson.delete({ where: { id: lesson.id } }); refresh(lesson.courseId); return { ok: true, courseId: lesson.courseId }; }

export async function createStudySession(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = studySessionInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error); const course = await db.course.findFirst({ where: { id: parsed.data.courseId, ownerId: owner.id }, select: { id: true } }); if (!course) return { ok: false, error: "Kurs bulunamadı." }; const startedAt = parsed.data.startedAt ?? new Date(); try { await db.studySession.create({ data: { courseId: course.id, startedAt, endedAt: parsed.data.endedAt, minutes: parsed.data.minutes, note: parsed.data.note } }); refresh(course.id); return { ok: true, courseId: course.id }; } catch { return { ok: false, error: "Çalışma oturumu kaydedilemedi." }; } }

export async function deleteStudySession(input: unknown): Promise<CourseActionResult> { const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = studySessionDeleteSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Oturum bulunamadı." }; const session = await db.studySession.findFirst({ where: { id: parsed.data.id, course: { ownerId: owner.id } }, select: { id: true, courseId: true } }); if (!session) return { ok: false, error: "Oturum bulunamadı." }; await db.studySession.delete({ where: { id: session.id } }); refresh(session.courseId); return { ok: true, courseId: session.courseId }; }

export async function createCourseNote(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseNoteInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const course = await db.course.findFirst({ where: { id: parsed.data.courseId, ownerId: owner.id }, select: { id: true } });
  if (!course) return { ok: false, error: "Kurs bulunamadı." };
  if (parsed.data.lessonId) {
    const lesson = await db.courseLesson.findFirst({ where: { id: parsed.data.lessonId, courseId: course.id }, select: { id: true } });
    if (!lesson) return { ok: false, error: "Ders bu kursa ait değil." };
  }
  try {
    const note = await db.note.create({ data: { ownerId: owner.id, courseId: course.id, lessonId: parsed.data.lessonId ?? null, title: parsed.data.title, content: parsed.data.content } });
    await recordActivity(owner.id, { type: "course.note.created", title: `Kurs notu eklendi: ${note.title}`, entityType: "note", entityId: note.id, metadata: { courseId: course.id, lessonId: parsed.data.lessonId ?? null } });
    refresh(course.id); return { ok: true, courseId: course.id };
  } catch { return { ok: false, error: "Kurs notu kaydedilemedi." }; }
}

export async function updateCourseNote(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseNoteUpdateSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const note = await db.note.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, courseId: { not: null } }, select: { id: true, courseId: true } });
  if (!note?.courseId) return { ok: false, error: "Kurs notu bulunamadı." };
  try { await db.note.update({ where: { id: note.id }, data: { title: parsed.data.title, content: parsed.data.content } }); await recordActivity(owner.id, { type: "course.note.updated", title: `Kurs notu güncellendi: ${parsed.data.title}`, entityType: "note", entityId: note.id }); refresh(note.courseId); return { ok: true, courseId: note.courseId }; }
  catch { return { ok: false, error: "Kurs notu güncellenemedi." }; }
}

export async function deleteCourseNote(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseNoteDeleteSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Kurs notu bulunamadı." };
  const note = await db.note.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, courseId: { not: null } }, select: { id: true, courseId: true } });
  if (!note?.courseId) return { ok: false, error: "Kurs notu bulunamadı." };
  await db.note.delete({ where: { id: note.id } }); await recordActivity(owner.id, { type: "course.note.deleted", title: "Kurs notu silindi", entityType: "note", entityId: note.id }); refresh(note.courseId); return { ok: true, courseId: note.courseId };
}

export async function createCourseGoal(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseGoalInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const course = await db.course.findFirst({ where: { id: parsed.data.courseId, ownerId: owner.id }, select: { id: true } });
  if (!course) return { ok: false, error: "Kurs bulunamadı." };
  try { const goal = await db.goal.create({ data: { ownerId: owner.id, courseId: course.id, title: parsed.data.title, description: parsed.data.description, dueDate: parsed.data.dueDate ?? null } }); await recordActivity(owner.id, { type: "course.goal.created", title: `Öğrenme hedefi eklendi: ${goal.title}`, entityType: "goal", entityId: goal.id, metadata: { courseId: course.id } }); refresh(course.id); return { ok: true, courseId: course.id }; }
  catch { return { ok: false, error: "Öğrenme hedefi kaydedilemedi." }; }
}

export async function updateCourseGoal(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseGoalUpdateSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const goal = await db.goal.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, courseId: { not: null } }, select: { id: true, courseId: true } });
  if (!goal?.courseId) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  try { await db.goal.update({ where: { id: goal.id }, data: { title: parsed.data.title, description: parsed.data.description, dueDate: parsed.data.dueDate ?? null } }); await recordActivity(owner.id, { type: "course.goal.updated", title: `Öğrenme hedefi güncellendi: ${parsed.data.title}`, entityType: "goal", entityId: goal.id }); refresh(goal.courseId); return { ok: true, courseId: goal.courseId }; }
  catch { return { ok: false, error: "Öğrenme hedefi güncellenemedi." }; }
}

export async function setCourseGoalCompleted(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseGoalCompletionSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Geçersiz hedef işlemi." };
  const goal = await db.goal.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, courseId: { not: null } }, select: { id: true, courseId: true } });
  if (!goal?.courseId) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  try { await db.goal.update({ where: { id: goal.id }, data: { completedAt: parsed.data.completed ? new Date() : null } }); await recordActivity(owner.id, { type: parsed.data.completed ? "course.goal.completed" : "course.goal.reopened", title: parsed.data.completed ? "Öğrenme hedefi tamamlandı" : "Öğrenme hedefi yeniden açıldı", entityType: "goal", entityId: goal.id }); refresh(goal.courseId); return { ok: true, courseId: goal.courseId }; }
  catch { return { ok: false, error: "Öğrenme hedefi güncellenemedi." }; }
}

export async function deleteCourseGoal(input: unknown): Promise<CourseActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = courseGoalDeleteSchema.safeParse(input); if (!parsed.success) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  const goal = await db.goal.findFirst({ where: { id: parsed.data.id, ownerId: owner.id, courseId: { not: null } }, select: { id: true, courseId: true } });
  if (!goal?.courseId) return { ok: false, error: "Öğrenme hedefi bulunamadı." };
  await db.goal.delete({ where: { id: goal.id } }); await recordActivity(owner.id, { type: "course.goal.deleted", title: "Öğrenme hedefi silindi", entityType: "goal", entityId: goal.id }); refresh(goal.courseId); return { ok: true, courseId: goal.courseId };
}
