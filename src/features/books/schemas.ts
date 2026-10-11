import { z } from "zod";
import { tagIdsInputSchema } from "@/features/tags/schemas";

export const readingStatuses = ["WANT_TO_READ", "READING", "COMPLETED", "PAUSED", "DROPPED"] as const;
export const readingStatusSchema = z.enum(readingStatuses);

const optionalNumber = (schema: z.ZodType<number>) => z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string") return Number(value);
    return value;
  },
  schema.optional(),
);

const optionalText = (max: number) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.string().trim().max(max).optional(),
);

export const bookInputSchema = z.object({
  tagIds: tagIdsInputSchema,
  title: z.string().trim().min(1, "Kitap adı gerekli.").max(200, "Kitap adı 200 karakteri geçemez."),
  author: optionalText(200),
  isbn: optionalText(32),
  coverUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(1000).url("Geçerli bir kapak adresi girin.").refine((value) => /^https?:\/\//i.test(value), "Kapak adresi http veya https ile başlamalı.").optional()),
  pageCount: optionalNumber(z.number().int("Sayfa sayısı tam sayı olmalı.").min(1, "Sayfa sayısı en az 1 olmalı.").max(100000, "Sayfa sayısı çok yüksek.")),
  currentPage: optionalNumber(z.number().int("Mevcut sayfa tam sayı olmalı.").min(0, "Mevcut sayfa 0 veya daha büyük olmalı.").max(100000, "Mevcut sayfa çok yüksek.")),
  genre: optionalText(100),
  description: optionalText(5000),
  publisher: optionalText(200),
  publicationYear: optionalNumber(z.number().int("Yıl tam sayı olmalı.").min(1000, "Geçerli bir yıl girin.").max(2200, "Geçerli bir yıl girin.")),
  rating: optionalNumber(z.number().min(0, "Puan 0 ile 10 arasında olmalı.").max(10, "Puan 0 ile 10 arasında olmalı.").refine((value) => value === undefined || Number.isInteger(value * 10), "Puan tek ondalık olabilir.")),
  review: optionalText(5000),
  status: readingStatusSchema.default("WANT_TO_READ"),
}).superRefine((value, context) => {
  if (value.pageCount !== undefined && value.currentPage !== undefined && value.currentPage > value.pageCount) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["currentPage"], message: "Mevcut sayfa toplam sayfadan büyük olamaz." });
  }
});

export const bookIdSchema = z.string().cuid("Geçersiz kitap kimliği.");
export const bookStatusInputSchema = z.object({ id: bookIdSchema, status: readingStatusSchema });
export const bookFavoriteInputSchema = z.object({ id: bookIdSchema, favorite: z.boolean() });
export const bookProgressInputSchema = z.object({
  id: bookIdSchema,
  currentPage: z.coerce.number().int("Sayfa tam sayı olmalı.").min(0, "Sayfa 0 veya daha büyük olmalı.").max(100000, "Sayfa çok yüksek."),
});

const dateInput = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.date().optional());

export const readingSessionInputSchema = z.object({
  bookId: bookIdSchema,
  startedAt: dateInput,
  endedAt: dateInput,
  pagesRead: z.coerce.number().int("Okunan sayfa tam sayı olmalı.").min(0, "Okunan sayfa negatif olamaz.").max(100000, "Okunan sayfa çok yüksek.").default(0),
  note: optionalText(2000),
}).superRefine((value, context) => {
  if (value.startedAt && value.endedAt && value.endedAt < value.startedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endedAt"], message: "Bitiş zamanı başlangıçtan önce olamaz." });
  }
});

export type BookInput = z.infer<typeof bookInputSchema>;
export type ReadingStatusValue = z.infer<typeof readingStatusSchema>;
export type ReadingSessionInput = z.infer<typeof readingSessionInputSchema>;
