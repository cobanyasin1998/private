import { z } from "zod";

export const accountTypes = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS", "OTHER"] as const;
export const transactionTypes = ["INCOME", "EXPENSE", "TRANSFER"] as const;
export const transactionKinds = ["INCOME", "EXPENSE"] as const;

const optionalText = (max: number) => z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().trim().max(max).optional());
const decimalPattern = /^-?\d+(?:[.,]\d{1,4})?$/;
export const decimalString = z.string().trim().regex(decimalPattern, "Geçerli bir tutar girin.");
export const positiveDecimalString = decimalString.refine((value) => Number(value.replace(",", ".")) > 0, "Tutar sıfırdan büyük olmalı.");
const dateValue = z.coerce.date({ invalid_type_error: "Geçerli bir tarih girin.", required_error: "Tarih gerekli." });

export const accountTypeSchema = z.enum(accountTypes);
export const transactionTypeSchema = z.enum(transactionTypes);
export const transactionKindSchema = z.enum(transactionKinds);

export const accountInputSchema = z.object({
  name: z.string().trim().min(1, "Hesap adı gerekli.").max(120, "Hesap adı 120 karakteri geçemez."),
  type: accountTypeSchema,
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Para birimi 3 harf olmalı."),
  openingBalance: decimalString.default("0"),
  archived: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Kategori adı gerekli.").max(80, "Kategori adı 80 karakteri geçemez."),
  kind: transactionKindSchema,
  color: optionalText(20),
});

export const transactionInputSchema = z.object({
  accountId: z.string().cuid("Geçersiz hesap."),
  categoryId: z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().cuid("Geçersiz kategori.").optional()),
  type: transactionKindSchema,
  amount: positiveDecimalString,
  occurredAt: dateValue,
  description: z.string().trim().min(1, "Açıklama gerekli.").max(240, "Açıklama 240 karakteri geçemez."),
  recurring: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
});

export const transferInputSchema = z.object({
  sourceAccountId: z.string().cuid("Geçersiz kaynak hesap."),
  destinationAccountId: z.string().cuid("Geçersiz hedef hesap."),
  amount: positiveDecimalString,
  occurredAt: dateValue,
  description: optionalText(240),
}).refine((value) => value.sourceAccountId !== value.destinationAccountId, { message: "Kaynak ve hedef hesap aynı olamaz.", path: ["destinationAccountId"] });

export const accountIdSchema = z.string().cuid("Geçersiz hesap.");
export const categoryIdSchema = z.string().cuid("Geçersiz kategori.");
export const transactionIdSchema = z.string().cuid("Geçersiz işlem.");
export const accountArchiveSchema = z.object({ id: accountIdSchema, archived: z.boolean() });
export const transactionFilterSchema = z.object({
  accountId: z.string().cuid().optional(),
  type: transactionKindSchema.optional(),
  query: z.string().trim().max(100).optional(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Geçerli bir ay seçin.").optional(),
});

export const budgetAllocationInputSchema = z.object({
  categoryId: z.string().cuid("Geçersiz kategori."),
  amount: positiveDecimalString,
});

export const budgetInputSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Geçerli bir ay seçin."),
  name: z.string().trim().min(1, "Bütçe adı gerekli.").max(120, "Bütçe adı 120 karakteri geçemez."),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Para birimi 3 harf olmalı."),
  allocations: z.array(budgetAllocationInputSchema).max(100, "En fazla 100 kategori ekleyebilirsiniz.").superRefine((allocations, ctx) => {
    const seen = new Set<string>();
    allocations.forEach((allocation, index) => {
      if (seen.has(allocation.categoryId)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Kategori yalnızca bir kez eklenebilir.", path: [index, "categoryId"] });
      seen.add(allocation.categoryId);
    });
  }),
});

export const budgetIdSchema = z.string().cuid("Geçersiz bütçe.");

export type AccountInput = z.infer<typeof accountInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type TransferInput = z.infer<typeof transferInputSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
