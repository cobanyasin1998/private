"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity/events";
import { getFinanceMessages } from "./messages";
import { accountArchiveSchema, accountIdSchema, accountInputSchema, budgetIdSchema, budgetInputSchema, categoryIdSchema, categoryInputSchema, transactionIdSchema, transactionInputSchema, transferInputSchema } from "./schemas";
import { canTransferCurrencies, transferLegAmounts } from "./rules";

export type FinanceActionResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
function validationError(error: z.ZodError): FinanceActionResult { return { ok: false, error: "Formu kontrol edin.", fieldErrors: error.flatten().fieldErrors }; }
function decimal(value: string) { return new Prisma.Decimal(value.replace(",", ".")); }
function refreshFinance() { revalidatePath("/finance"); revalidatePath("/dashboard"); }

export async function createAccount(input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = accountInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const account = await db.financialAccount.create({ data: { ownerId: owner.id, name: parsed.data.name, type: parsed.data.type, currency: parsed.data.currency, openingBalance: decimal(parsed.data.openingBalance), archived: parsed.data.archived } }); await recordActivity(owner.id, { type: "finance.account.created", title: `Hesap eklendi: ${account.name}`, entityType: "financialAccount", entityId: account.id }); refreshFinance(); return { ok: true, id: account.id }; } catch { return { ok: false, error: "Hesap kaydedilemedi." }; }
}

export async function updateAccount(id: string, input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsedId = accountIdSchema.safeParse(id); if (!parsedId.success) return { ok: false, error: "Hesap bulunamadı." };
  const parsed = accountInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const existing = await db.financialAccount.findFirst({ where: { id: parsedId.data, ownerId: owner.id }, select: { id: true, currency: true } }); if (!existing) return { ok: false, error: "Hesap bulunamadı." };
  if (existing.currency !== parsed.data.currency) { const transactionCount = await db.financialTransaction.count({ where: { ownerId: owner.id, accountId: existing.id } }); if (transactionCount > 0) return { ok: false, error: "İşlem bulunan hesabın para birimi değiştirilemez." }; }
  try { await db.financialAccount.update({ where: { id: existing.id }, data: { name: parsed.data.name, type: parsed.data.type, currency: parsed.data.currency, openingBalance: decimal(parsed.data.openingBalance), archived: parsed.data.archived } }); refreshFinance(); return { ok: true, id: existing.id }; } catch { return { ok: false, error: "Hesap güncellenemedi." }; }
}

export async function archiveAccount(input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = accountArchiveSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const updated = await db.financialAccount.updateMany({ where: { id: parsed.data.id, ownerId: owner.id }, data: { archived: parsed.data.archived } }); if (updated.count === 0) return { ok: false, error: "Hesap bulunamadı." }; refreshFinance(); return { ok: true, id: parsed.data.id };
}

export async function deleteAccount(id: string): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = accountIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Hesap bulunamadı." };
  const count = await db.financialTransaction.count({ where: { ownerId: owner.id, accountId: parsed.data } }); if (count > 0) return { ok: false, error: "İşlem bulunan hesap silinemez; hesabı arşivleyin." };
  const deleted = await db.financialAccount.deleteMany({ where: { id: parsed.data, ownerId: owner.id } }); if (!deleted.count) return { ok: false, error: "Hesap bulunamadı." }; refreshFinance(); return { ok: true, id: parsed.data };
}

export async function createCategory(input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsed = categoryInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { const category = await db.financialCategory.create({ data: { ownerId: owner.id, name: parsed.data.name, kind: parsed.data.kind, color: parsed.data.color } }); refreshFinance(); return { ok: true, id: category.id }; } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "Bu kategoride aynı isim zaten var." }; return { ok: false, error: "Kategori kaydedilemedi." }; }
}

export async function updateCategory(id: string, input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const parsedId = categoryIdSchema.safeParse(id); if (!parsedId.success) return { ok: false, error: "Kategori bulunamadı." }; const parsed = categoryInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const existing = await db.financialCategory.findFirst({ where: { id: parsedId.data, ownerId: owner.id }, select: { id: true, kind: true } }); if (!existing) return { ok: false, error: "Kategori bulunamadı." };
  if (existing.kind !== parsed.data.kind) { const incompatible = await db.financialTransaction.count({ where: { ownerId: owner.id, categoryId: existing.id, type: { not: parsed.data.kind } } }); if (incompatible > 0) return { ok: false, error: "İşlem bulunan kategorinin türü değiştirilemez." }; }
  try { await db.financialCategory.update({ where: { id: existing.id }, data: { name: parsed.data.name, kind: parsed.data.kind, color: parsed.data.color } }); refreshFinance(); return { ok: true, id: parsedId.data }; } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "Bu kategoride aynı isim zaten var." }; return { ok: false, error: "Kategori güncellenemedi." }; }
}

export async function deleteCategory(id: string): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = categoryIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Kategori bulunamadı." }; const deleted = await db.financialCategory.deleteMany({ where: { id: parsed.data, ownerId: owner.id } }); if (!deleted.count) return { ok: false, error: "Kategori bulunamadı." }; refreshFinance(); return { ok: true, id: parsed.data };
}

export async function createTransaction(input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = transactionInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const account = await db.financialAccount.findFirst({ where: { id: parsed.data.accountId, ownerId: owner.id }, select: { id: true, currency: true } }); if (!account) return { ok: false, error: "Hesap bulunamadı." };
  if (parsed.data.categoryId) { const category = await db.financialCategory.findFirst({ where: { id: parsed.data.categoryId, ownerId: owner.id, kind: parsed.data.type }, select: { id: true } }); if (!category) return { ok: false, error: "Kategori işlem türüyle eşleşmiyor." }; }
  try { const transaction = await db.financialTransaction.create({ data: { ownerId: owner.id, accountId: account.id, categoryId: parsed.data.categoryId, type: parsed.data.type, amount: decimal(parsed.data.amount), currency: account.currency, occurredAt: parsed.data.occurredAt, description: parsed.data.description, recurring: parsed.data.recurring } }); await recordActivity(owner.id, { type: "finance.transaction.created", title: `${parsed.data.type === "INCOME" ? "Gelir" : "Gider"} eklendi: ${transaction.description}`, entityType: "financialTransaction", entityId: transaction.id }); refreshFinance(); return { ok: true, id: transaction.id }; } catch { return { ok: false, error: "İşlem kaydedilemedi." }; }
}

export async function updateTransaction(id: string, input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsedId = transactionIdSchema.safeParse(id); if (!parsedId.success) return { ok: false, error: "İşlem bulunamadı." }; const parsed = transactionInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const existing = await db.financialTransaction.findFirst({ where: { id: parsedId.data, ownerId: owner.id }, include: { account: { select: { currency: true } } } }); if (!existing) return { ok: false, error: "İşlem bulunamadı." }; if (existing.transferGroup) return { ok: false, error: "Transfer ayağı ayrı düzenlenemez; transferi silip yeniden oluşturun." };
  if (existing.accountId !== parsed.data.accountId) { const account = await db.financialAccount.findFirst({ where: { id: parsed.data.accountId, ownerId: owner.id }, select: { currency: true } }); if (!account) return { ok: false, error: "Hesap bulunamadı." }; if (account.currency !== existing.currency) return { ok: false, error: "Farklı para birimine taşımak için transfer kullanın." }; }
  const categoryOk = !parsed.data.categoryId || await db.financialCategory.findFirst({ where: { id: parsed.data.categoryId, ownerId: owner.id, kind: parsed.data.type }, select: { id: true } }); if (!categoryOk) return { ok: false, error: "Kategori işlem türüyle eşleşmiyor." };
  try { await db.financialTransaction.update({ where: { id: existing.id }, data: { accountId: parsed.data.accountId, categoryId: parsed.data.categoryId, type: parsed.data.type, amount: decimal(parsed.data.amount), occurredAt: parsed.data.occurredAt, description: parsed.data.description, recurring: parsed.data.recurring } }); refreshFinance(); return { ok: true, id: existing.id }; } catch { return { ok: false, error: "İşlem güncellenemedi." }; }
}

export async function deleteTransaction(id: string): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = transactionIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "İşlem bulunamadı." }; const existing = await db.financialTransaction.findFirst({ where: { id: parsed.data, ownerId: owner.id }, select: { id: true, transferGroup: true } }); if (!existing) return { ok: false, error: "İşlem bulunamadı." }; const deleted = existing.transferGroup ? await db.financialTransaction.deleteMany({ where: { ownerId: owner.id, transferGroup: existing.transferGroup } }) : await db.financialTransaction.deleteMany({ where: { id: existing.id, ownerId: owner.id } }); if (!deleted.count) return { ok: false, error: "İşlem bulunamadı." }; refreshFinance(); return { ok: true, id: parsed.data };
}

export async function createTransfer(input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." }; const parsed = transferInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const accounts = await db.financialAccount.findMany({ where: { ownerId: owner.id, id: { in: [parsed.data.sourceAccountId, parsed.data.destinationAccountId] } }, select: { id: true, name: true, currency: true } }); const source = accounts.find((account) => account.id === parsed.data.sourceAccountId); const destination = accounts.find((account) => account.id === parsed.data.destinationAccountId); if (!source || !destination) return { ok: false, error: "Kaynak veya hedef hesap bulunamadı." }; if (!canTransferCurrencies(source.currency, destination.currency)) return { ok: false, error: "Farklı para birimleri arasında transfer için açık kur dönüşümü gerekir." };
  const transferGroup = randomUUID(); const amount = decimal(parsed.data.amount); const legs = transferLegAmounts(amount); const description = parsed.data.description || `Transfer: ${source.name} → ${destination.name}`;
  try { await db.$transaction(async (tx) => { await tx.financialTransaction.create({ data: { ownerId: owner.id, accountId: source.id, type: "TRANSFER", amount: legs.source, currency: source.currency, occurredAt: parsed.data.occurredAt, description, transferGroup } }); await tx.financialTransaction.create({ data: { ownerId: owner.id, accountId: destination.id, type: "TRANSFER", amount: legs.destination, currency: destination.currency, occurredAt: parsed.data.occurredAt, description, transferGroup } }); }); await recordActivity(owner.id, { type: "finance.transfer.created", title: `Transfer: ${source.name} → ${destination.name}`, entityType: "financialTransaction", entityId: transferGroup }); refreshFinance(); return { ok: true, id: transferGroup }; } catch { return { ok: false, error: "Transfer kaydedilemedi." }; }
}

function monthDate(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}

export async function saveBudget(input: unknown): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const t = getFinanceMessages(owner.locale);
  const parsed = budgetInputSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  const categoryIds = parsed.data.allocations.map((allocation) => allocation.categoryId);
  const categories = await db.financialCategory.findMany({ where: { ownerId: owner.id, kind: "EXPENSE", id: { in: categoryIds } }, select: { id: true } });
  if (categories.length !== new Set(categoryIds).size) return { ok: false, error: t.invalidCategories };
  const month = monthDate(parsed.data.month);
  try {
    const budget = await db.$transaction(async (tx) => {
      const saved = await tx.budget.upsert({
        where: { ownerId_month: { ownerId: owner.id, month } },
        create: { ownerId: owner.id, month, name: parsed.data.name, currency: parsed.data.currency },
        update: { name: parsed.data.name, currency: parsed.data.currency },
        select: { id: true },
      });
      await tx.budgetAllocation.deleteMany({ where: { budgetId: saved.id } });
      if (parsed.data.allocations.length) {
        await tx.budgetAllocation.createMany({ data: parsed.data.allocations.map((allocation) => ({ budgetId: saved.id, categoryId: allocation.categoryId, amount: decimal(allocation.amount) })) });
      }
      return saved;
    });
    await recordActivity(owner.id, { type: "finance.budget.saved", title: t.savedActivity(parsed.data.name), entityType: "budget", entityId: budget.id });
    refreshFinance();
    return { ok: true, id: budget.id };
  } catch { return { ok: false, error: t.saveError }; }
}

export async function deleteBudget(id: string): Promise<FinanceActionResult> {
  const owner = await getSessionOwner(); if (!owner) return { ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." };
  const t = getFinanceMessages(owner.locale);
  const parsed = budgetIdSchema.safeParse(id); if (!parsed.success) return { ok: false, error: "Bütçe bulunamadı." };
  const deleted = await db.budget.deleteMany({ where: { id: parsed.data, ownerId: owner.id } });
  if (!deleted.count) return { ok: false, error: t.budgetMissing };
  await recordActivity(owner.id, { type: "finance.budget.deleted", title: t.deletedActivity, entityType: "budget", entityId: parsed.data });
  refreshFinance();
  return { ok: true, id: parsed.data };
}
