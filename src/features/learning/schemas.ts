import { z } from "zod";
import { tagIdsInputSchema } from "@/features/tags/schemas";

export const learningGroups = ["TECHNOLOGY", "ACADEMIC", "PERSONAL_LIFE"] as const;
export const learningLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const learningStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED"] as const;
export const learningItemTypes = ["TOPIC", "PRACTICE", "LAB", "MINI_PROJECT", "QUIZ", "READING", "VIDEO", "REVIEW"] as const;
export const travelStatuses = ["WISHLIST", "VISITED"] as const;
export const travelPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const englishSkills = ["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "SPEAKING", "WRITING"] as const;
export const englishEntryTypes = englishSkills;

const optionalText = (max: number) => z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : value, z.string().trim().max(max).optional());
const clearableText = (max: number) => z.preprocess((value) => value === "" || value === null ? null : value, z.string().trim().max(max).nullable().optional());
const optionalNumber = (max: number) => z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : typeof value === "string" ? Number(value) : value, z.number().int().min(0).max(max).optional());
const optionalDate = z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : value, z.coerce.date().optional());
const httpUrl = z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : value, z.string().trim().max(2000).url("Geçerli bir adres girin.").refine((value) => /^https?:\/\//i.test(value), "Adres http veya https ile başlamalı.").optional());
const resourceUrl = z.string().trim().max(2000).url("Geçerli bir kaynak adresi girin.").refine((value) => /^https?:\/\//i.test(value), "Kaynak adresi http veya https ile başlamalı.");
const decimalString = z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : typeof value === "number" ? String(value) : value, z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/, "Geçerli bir bütçe girin.").transform((value) => value.replace(",", ".")).optional());

export const learningAreaIdSchema = z.string().cuid("Geçersiz öğrenme alanı kimliği.");
export const learningItemIdSchema = z.string().cuid("Geçersiz konu kimliği.");
const optionalLearningItemLink = z.preprocess((value) => value === "" || value === null ? null : value, learningItemIdSchema.nullable().optional());
export const learningTodoIdSchema = z.string().cuid("Geçersiz yapılacak kimliği.");
export const travelPlaceIdSchema = z.string().cuid("Geçersiz yer kimliği.");
export const englishEntryIdSchema = z.string().cuid("Geçersiz İngilizce kaydı.");

const learningAreaFields = {
  slug: z.string().trim().min(1, "Alan kodu gerekli.").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Alan kodu geçersiz.").optional(),
  name: z.string().trim().min(1, "Alan adı gerekli.").max(200),
  description: optionalText(5000),
  group: z.enum(learningGroups),
  category: optionalText(120),
  subCategory: optionalText(120),
  level: z.enum(learningLevels).default("BEGINNER"),
  status: z.enum(learningStatuses).default("PLANNED"),
  progress: optionalNumber(100).default(0),
  estimatedMinutes: optionalNumber(1000000),
  prerequisites: optionalText(5000),
  notes: optionalText(10000),
  resourceUrls: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return [];
    if (typeof value === "string") return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    return value;
  }, z.array(resourceUrl).max(50).default([])),
  lastWorkedAt: optionalDate,
  completedAt: optionalDate,
  englishLevel: optionalText(40),
  tagIds: tagIdsInputSchema,
};
const learningAreaRules = (value: z.infer<z.ZodObject<typeof learningAreaFields>>, context: z.RefinementCtx) => {
  if (value.status === "COMPLETED" && value.progress < 100) context.addIssue({ code: z.ZodIssueCode.custom, path: ["progress"], message: "Tamamlanan alanın ilerlemesi %100 olmalı." });
};
export const learningAreaInputSchema = z.object(learningAreaFields).superRefine(learningAreaRules);

export const learningAreaUpdateSchema = z.object({ ...learningAreaFields, id: learningAreaIdSchema }).superRefine(learningAreaRules);

export const learningItemInputSchema = z.object({
  areaId: learningAreaIdSchema,
  parentId: z.preprocess((value) => value === "" || value === null || value === undefined ? null : value, learningItemIdSchema.nullable().optional()),
  title: z.string().trim().min(1, "Konu başlığı gerekli.").max(240),
  description: optionalText(5000),
  summary: clearableText(5000),
  content: clearableText(30000),
  requirements: clearableText(10000),
  goals: clearableText(10000),
  type: z.enum(learningItemTypes).default("TOPIC"),
  position: optionalNumber(100000),
  estimatedMinutes: optionalNumber(1000000),
  notes: optionalText(10000),
  externalUrl: httpUrl,
  tagIds: tagIdsInputSchema,
});
export const learningItemUpdateSchema = learningItemInputSchema.extend({ id: learningItemIdSchema });
export const learningItemCompletionSchema = z.object({ id: learningItemIdSchema, completed: z.boolean() });
export const learningItemDeleteSchema = z.object({ id: learningItemIdSchema });

export const learningTodoStatuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELED"] as const;
export const learningTodoPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const learningTodoInputSchema = z.object({
  areaId: learningAreaIdSchema,
  itemId: optionalLearningItemLink,
  title: z.string().trim().min(1, "Yapılacak başlığı gerekli.").max(240),
  description: optionalText(5000),
  status: z.enum(learningTodoStatuses).default("TODO"),
  priority: z.enum(learningTodoPriorities).default("MEDIUM"),
  dueDate: optionalDate,
  completedAt: optionalDate,
});
export const learningTodoUpdateSchema = learningTodoInputSchema.extend({ id: learningTodoIdSchema });
export const learningTodoCompletionSchema = z.object({ id: learningTodoIdSchema, completed: z.boolean() });
export const learningTodoDeleteSchema = z.object({ id: learningTodoIdSchema });

export const learningProgressSchema = z.object({ id: learningAreaIdSchema, progress: z.coerce.number().int().min(0).max(100) });
export const learningAreaDeleteSchema = z.object({ id: learningAreaIdSchema });

export const learningStudySessionInputSchema = z.object({
  areaId: learningAreaIdSchema,
  startedAt: optionalDate,
  endedAt: optionalDate,
  minutes: z.coerce.number().int().min(0).max(1440).default(0),
  note: optionalText(3000),
}).superRefine((value, context) => {
  if (value.startedAt && value.endedAt && value.endedAt < value.startedAt) context.addIssue({ code: z.ZodIssueCode.custom, path: ["endedAt"], message: "Bitiş zamanı başlangıçtan önce olamaz." });
});
export const learningStudySessionDeleteSchema = z.object({ id: z.string().cuid("Geçersiz çalışma oturumu.") });

export const travelPlaceInputSchema = z.object({
  placeName: z.string().trim().min(1, "Yer adı gerekli.").max(200),
  city: optionalText(120),
  country: optionalText(120),
  status: z.enum(travelStatuses).default("WISHLIST"),
  priority: z.enum(travelPriorities).default("MEDIUM"),
  estimatedBudget: decimalString,
  currency: z.string().trim().toUpperCase().length(3).default("TRY"),
  notes: optionalText(10000),
  photoUrl: httpUrl,
  externalUrl: httpUrl,
  visitedAt: optionalDate,
  tagIds: tagIdsInputSchema,
});
export const travelPlaceUpdateSchema = travelPlaceInputSchema.extend({ id: travelPlaceIdSchema });
export const travelPlaceDeleteSchema = z.object({ id: travelPlaceIdSchema });
export const travelPlaceStatusSchema = z.object({ id: travelPlaceIdSchema, status: z.enum(travelStatuses), visitedAt: optionalDate });

export const englishSkillProgressInputSchema = z.object({
  areaId: learningAreaIdSchema,
  skill: z.enum(englishSkills),
  level: optionalText(40),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  assessedAt: optionalDate,
});
export const englishEntryInputSchema = z.object({
  areaId: learningAreaIdSchema,
  type: z.enum(englishEntryTypes),
  title: z.string().trim().min(1, "İngilizce çalışma başlığı gerekli.").max(240),
  content: optionalText(20000),
  notes: optionalText(10000),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  completedAt: optionalDate,
});
export const englishEntryUpdateSchema = englishEntryInputSchema.extend({ id: englishEntryIdSchema });
export const englishEntryDeleteSchema = z.object({ id: englishEntryIdSchema });

export const learningNoteInputSchema = z.object({
  areaId: learningAreaIdSchema,
  itemId: optionalLearningItemLink,
  title: z.string().trim().min(1, "Not başlığı gerekli.").max(200),
  content: z.string().trim().min(1, "Not içeriği gerekli.").max(20000),
});
export const learningNoteUpdateSchema = learningNoteInputSchema.extend({ id: z.string().cuid("Geçersiz not kimliği.") });
export const learningNoteDeleteSchema = z.object({ id: z.string().cuid("Geçersiz not kimliği.") });
export const learningGoalInputSchema = z.object({ areaId: learningAreaIdSchema, itemId: optionalLearningItemLink, title: z.string().trim().min(1, "Hedef başlığı gerekli.").max(200), description: optionalText(5000), dueDate: optionalDate });
export const learningGoalUpdateSchema = learningGoalInputSchema.extend({ id: z.string().cuid("Geçersiz hedef kimliği.") });
export const learningGoalCompletionSchema = z.object({ id: z.string().cuid("Geçersiz hedef kimliği."), completed: z.boolean() });
export const learningGoalDeleteSchema = z.object({ id: z.string().cuid("Geçersiz hedef kimliği.") });

export type LearningAreaInput = z.infer<typeof learningAreaInputSchema>;
export type LearningItemInput = z.infer<typeof learningItemInputSchema>;
export type LearningStudySessionInput = z.infer<typeof learningStudySessionInputSchema>;
export type TravelPlaceInput = z.infer<typeof travelPlaceInputSchema>;
export type EnglishSkillProgressInput = z.infer<typeof englishSkillProgressInputSchema>;
export type EnglishEntryInput = z.infer<typeof englishEntryInputSchema>;
