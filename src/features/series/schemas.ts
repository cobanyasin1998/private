import { z } from "zod";

export const seriesStatuses = ["PLANNED", "WATCHING", "COMPLETED", "DROPPED"] as const;
export const seriesStatusSchema = z.enum(seriesStatuses);

const optionalInt = (min: number, max: number) => z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : Number(value), z.number().int().min(min).max(max).optional());

export const seriesInputSchema = z.object({
  title: z.string().trim().min(1, "Dizi adı gerekli.").max(200),
  releaseYear: optionalInt(1888, 2200),
  posterUrl: z.preprocess((value) => value === "" ? undefined : value, z.string().url("Geçerli bir poster adresi girin.").max(1000).optional()),
  status: seriesStatusSchema.default("PLANNED"),
  rating: z.preprocess((value) => value === "" || value === null || value === undefined ? undefined : Number(value), z.number().min(0).max(10).multipleOf(0.1).optional()),
  favorite: z.boolean().default(false),
}).strict();

export const seriesIdSchema = z.string().cuid("Geçersiz dizi kimliği.");
export const seriesStatusInputSchema = z.object({ id: seriesIdSchema, status: seriesStatusSchema });
export const seriesFavoriteInputSchema = z.object({ id: seriesIdSchema, favorite: z.boolean() });

export const seasonInputSchema = z.object({
  seriesId: seriesIdSchema,
  number: z.preprocess((value) => Number(value), z.number().int().positive().max(1000)),
  title: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(200).optional()),
}).strict();

export const episodeInputSchema = z.object({
  seasonId: seriesIdSchema,
  number: z.preprocess((value) => Number(value), z.number().int().positive().max(10000)),
  title: z.string().trim().min(1, "Bölüm adı gerekli.").max(300),
}).strict();

export const episodeWatchedInputSchema = z.object({ id: seriesIdSchema, watched: z.boolean() });

export type SeriesInput = z.infer<typeof seriesInputSchema>;
