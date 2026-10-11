import { z } from "zod";
import { tagEntityTypes } from "./types";

export const tagNameSchema = z.string().trim().min(1, "Etiket adı gerekli.").max(60, "Etiket adı 60 karakteri geçemez.");
export const tagColorSchema = z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().regex(/^#[0-9a-f]{6}$/i, "Renk #RRGGBB biçiminde olmalı.").optional());

export const tagInputSchema = z.object({ name: tagNameSchema, color: tagColorSchema });
export const tagIdSchema = z.string().cuid("Geçersiz etiket kimliği.");
export const tagEntityTypeSchema = z.enum(tagEntityTypes);

const tagIdsSchema = z.array(tagIdSchema).max(30, "En fazla 30 etiket seçilebilir.").transform((ids) => [...new Set(ids)]);
export const tagIdsInputSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}, tagIdsSchema.default([]));

export const tagAssignmentSchema = z.object({
  entityType: tagEntityTypeSchema,
  entityId: z.string().cuid("Geçersiz kayıt kimliği."),
  tagIds: tagIdsInputSchema,
});

export type TagInput = z.infer<typeof tagInputSchema>;
export type TagAssignmentInput = z.infer<typeof tagAssignmentSchema>;

