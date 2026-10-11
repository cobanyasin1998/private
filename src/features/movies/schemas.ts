import { z } from "zod";
import { tagIdsInputSchema } from "@/features/tags/schemas";

export const movieStatuses = ["PLANNED", "WATCHING", "COMPLETED", "DROPPED"] as const;
export const movieStatusSchema = z.enum(movieStatuses);

const optionalNumber = (schema: z.ZodType<number>) => z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string") return Number(value);
    return value;
  },
  schema.optional(),
);

export const movieInputSchema = z.object({
  tagIds: tagIdsInputSchema,
  title: z.string().trim().min(1, "Film adı gerekli.").max(200, "Film adı 200 karakteri geçemez."),
  releaseYear: optionalNumber(z.number().int("Yıl tam sayı olmalı.").min(1888, "Geçerli bir yıl girin.").max(2200, "Geçerli bir yıl girin.")),
  runtimeMins: optionalNumber(z.number().int("Süre tam sayı olmalı.").min(1, "Süre 1 dakikadan kısa olamaz.").max(2000, "Süre çok uzun.")),
  posterUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(1000).url("Geçerli bir görsel adresi girin.").refine((value) => /^https?:\/\//i.test(value), "Görsel adresi http veya https ile başlamalı.").optional()),
  status: movieStatusSchema.default("PLANNED"),
  rating: optionalNumber(z.number().min(0, "Puan 0 ile 10 arasında olmalı.").max(10, "Puan 0 ile 10 arasında olmalı.").refine((value) => value === undefined || Number.isInteger(value * 10), "Puan tek ondalık olabilir.")),
  review: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(5000, "Yorum 5000 karakteri geçemez.").optional()),
});

export const movieIdSchema = z.string().cuid("Geçersiz film kimliği.");
export const movieStatusInputSchema = z.object({ id: movieIdSchema, status: movieStatusSchema });
export const movieFavoriteInputSchema = z.object({ id: movieIdSchema, favorite: z.boolean() });

export type MovieInput = z.infer<typeof movieInputSchema>;
export type MovieStatusValue = z.infer<typeof movieStatusSchema>;
