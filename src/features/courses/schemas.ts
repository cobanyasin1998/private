import { z } from "zod";
import { tagIdsInputSchema } from "@/features/tags/schemas";

export const courseStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED", "DROPPED"] as const;
export const courseStatusSchema = z.enum(courseStatuses);

const optionalText = (max: number) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.string().trim().max(max).optional(),
);
const optionalNumber = (schema: z.ZodType<number>) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : typeof value === "string" ? Number(value) : value,
  schema.optional(),
);

export const courseInputSchema = z.object({
  tagIds: tagIdsInputSchema,
  name: z.string().trim().min(1, "Kurs adı gerekli.").max(200, "Kurs adı 200 karakteri geçemez."),
  category: optionalText(100),
  description: optionalText(5000),
  provider: optionalText(200),
  externalUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(1000).url("Geçerli bir kurs adresi girin.").refine((value) => /^https?:\/\//i.test(value), "Kurs adresi http veya https ile başlamalı.").optional()),
  status: courseStatusSchema.default("PLANNED"),
  progress: optionalNumber(z.number().int("İlerleme tam sayı olmalı.").min(0, "İlerleme 0 veya daha büyük olmalı.").max(100, "İlerleme 100'ü geçemez.")).default(0),
}).superRefine((value, context) => {
  if (value.status === "COMPLETED" && value.progress !== undefined && value.progress < 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["progress"], message: "Tamamlanan kursun ilerlemesi %100 olmalı." });
  }
});

export const courseIdSchema = z.string().cuid("Geçersiz kurs kimliği.");
export const courseStatusInputSchema = z.object({ id: courseIdSchema, status: courseStatusSchema });
export const courseProgressInputSchema = z.object({ id: courseIdSchema, progress: z.coerce.number().int("İlerleme tam sayı olmalı.").min(0).max(100) });

export const courseLessonInputSchema = z.object({
  courseId: courseIdSchema,
  title: z.string().trim().min(1, "Ders başlığı gerekli.").max(240),
  position: optionalNumber(z.number().int().min(1).max(100000)),
  notes: optionalText(3000),
});
export const courseLessonUpdateSchema = z.object({
  id: courseIdSchema,
  title: z.string().trim().min(1, "Ders başlığı gerekli.").max(240),
  notes: optionalText(3000),
});
export const courseLessonCompletionSchema = z.object({ id: courseIdSchema, completed: z.boolean() });
export const courseLessonDeleteSchema = z.object({ id: courseIdSchema });

const dateInput = z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : value, z.coerce.date().optional());
export const studySessionInputSchema = z.object({
  courseId: courseIdSchema,
  startedAt: dateInput,
  endedAt: dateInput,
  minutes: z.coerce.number().int("Dakika tam sayı olmalı.").min(0, "Dakika negatif olamaz.").max(1440, "Bir oturum 24 saati geçemez.").default(0),
  note: optionalText(2000),
}).superRefine((value, context) => {
  if (value.startedAt && value.endedAt && value.endedAt < value.startedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endedAt"], message: "Bitiş zamanı başlangıçtan önce olamaz." });
  }
});
export const studySessionDeleteSchema = z.object({ id: courseIdSchema });

const courseRelationId = z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : value, courseIdSchema.optional());
const noteContent = z.string().trim().min(1, "Not içeriği gerekli.").max(10000, "Not 10.000 karakteri geçemez.");
const noteTitle = z.string().trim().min(1, "Not başlığı gerekli.").max(200, "Not başlığı 200 karakteri geçemez.");

export const courseNoteInputSchema = z.object({
  courseId: courseIdSchema,
  lessonId: courseRelationId,
  title: noteTitle,
  content: noteContent,
});
export const courseNoteUpdateSchema = z.object({
  id: courseIdSchema,
  title: noteTitle,
  content: noteContent,
});
export const courseNoteDeleteSchema = z.object({ id: courseIdSchema });

const dueDateInput = z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : value, z.coerce.date().optional());
const goalTitle = z.string().trim().min(1, "Hedef başlığı gerekli.").max(200, "Hedef başlığı 200 karakteri geçemez.");
export const courseGoalInputSchema = z.object({
  courseId: courseIdSchema,
  title: goalTitle,
  description: optionalText(5000),
  dueDate: dueDateInput,
});
export const courseGoalUpdateSchema = z.object({
  id: courseIdSchema,
  title: goalTitle,
  description: optionalText(5000),
  dueDate: dueDateInput,
});
export const courseGoalCompletionSchema = z.object({ id: courseIdSchema, completed: z.boolean() });
export const courseGoalDeleteSchema = z.object({ id: courseIdSchema });

export type CourseInput = z.infer<typeof courseInputSchema>;
export type CourseStatusValue = z.infer<typeof courseStatusSchema>;
export type CourseLessonInput = z.infer<typeof courseLessonInputSchema>;
export type StudySessionInput = z.infer<typeof studySessionInputSchema>;
export type CourseNoteInput = z.infer<typeof courseNoteInputSchema>;
export type CourseGoalInput = z.infer<typeof courseGoalInputSchema>;
