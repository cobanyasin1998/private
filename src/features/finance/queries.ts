import type { AccountType, TransactionType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { FinanceAccount, FinanceBudget, FinanceCategory, FinanceData, FinanceReport, FinanceStats, FinanceTransaction } from "./types";
import { transactionFilterSchema } from "./schemas";

function signedAmount(balance: Prisma.Decimal, type: TransactionType, amount: Prisma.Decimal) {
  if (type === "EXPENSE") return balance.minus(amount);
  return balance.plus(amount);
}

function serializeAccount(account: { id: string; name: string; type: AccountType; currency: string; openingBalance: Prisma.Decimal; archived: boolean }, balance: Prisma.Decimal): FinanceAccount {
  return { id: account.id, name: account.name, type: account.type, currency: account.currency, openingBalance: account.openingBalance.toString(), balance: balance.toString(), archived: account.archived };
}

function monthParts(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  return { start, end: new Date(Date.UTC(year, monthNumber, 1)) };
}

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function serializeBudget(budget: { id: string; month: Date; name: string; currency: string; allocations: Array<{ id: string; amount: Prisma.Decimal; category: { id: string; name: string } }> }): FinanceBudget {
  const allocations = budget.allocations.map((allocation) => ({ id: allocation.id, categoryId: allocation.category.id, categoryName: allocation.category.name, amount: allocation.amount.toString() }));
  const total = allocations.reduce((sum, allocation) => sum.plus(new Prisma.Decimal(allocation.amount)), new Prisma.Decimal(0)).toString();
  return { id: budget.id, month: `${budget.month.getUTCFullYear()}-${String(budget.month.getUTCMonth() + 1).padStart(2, "0")}`, name: budget.name, currency: budget.currency, allocations, total };
}

export function calculateBalance(openingBalance: Prisma.Decimal, transactions: readonly { type: TransactionType; amount: Prisma.Decimal }[]) {
  return transactions.reduce((balance, transaction) => signedAmount(balance, transaction.type, transaction.amount), openingBalance);
}

export async function getFinanceData(ownerId: string, rawFilters: unknown = {}): Promise<FinanceData> {
  const parsed = transactionFilterSchema.safeParse(rawFilters);
  const filters = parsed.success ? parsed.data : {};
  const accounts = await db.financialAccount.findMany({ where: { ownerId }, orderBy: [{ archived: "asc" }, { name: "asc" }] });
  const categories = await db.financialCategory.findMany({ where: { ownerId, kind: { in: ["INCOME", "EXPENSE"] } }, orderBy: [{ kind: "asc" }, { name: "asc" }] });
  const reportMonth = filters.month ?? currentMonth();
  const reportRange = monthParts(reportMonth);
  const transactions = await db.financialTransaction.findMany({
    where: { ownerId, ...(filters.accountId ? { accountId: filters.accountId } : {}), ...(filters.type ? { type: filters.type } : {}), ...(filters.query ? { description: { contains: filters.query, mode: "insensitive" } } : {}), ...(filters.month ? { occurredAt: { gte: reportRange.start, lt: reportRange.end } } : {}) },
    include: { account: { select: { name: true } }, category: { select: { name: true } } },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], take: 200,
  });
  const accountTransactions = await db.financialTransaction.findMany({ where: { ownerId }, select: { accountId: true, type: true, amount: true } });
  const balanceByAccount = new Map<string, Prisma.Decimal>();
  for (const account of accounts) balanceByAccount.set(account.id, calculateBalance(account.openingBalance, accountTransactions.filter((item) => item.accountId === account.id)));
  const serializedAccounts = accounts.map((account) => serializeAccount(account, balanceByAccount.get(account.id) ?? account.openingBalance));
  const serializedTransactions: FinanceTransaction[] = transactions.map((transaction) => ({ id: transaction.id, accountId: transaction.accountId, accountName: transaction.account.name, categoryId: transaction.categoryId, categoryName: transaction.category?.name ?? null, type: transaction.type, amount: transaction.amount.toString(), currency: transaction.currency, occurredAt: transaction.occurredAt.toISOString(), description: transaction.description, transferGroup: transaction.transferGroup, recurring: transaction.recurring }));
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const balancesByCurrency = serializedAccounts.reduce<Record<string, Prisma.Decimal>>((result, account) => { result[account.currency] = (result[account.currency] ?? new Prisma.Decimal(0)).plus(new Prisma.Decimal(account.balance)); return result; }, {});
  const monthWithCurrency = await db.financialTransaction.findMany({ where: { ownerId, occurredAt: { gte: start } }, select: { type: true, amount: true, currency: true } });
  const sumByCurrency = (type: TransactionType) => monthWithCurrency.filter((item) => item.type === type).reduce<Record<string, Prisma.Decimal>>((result, item) => { result[item.currency] = (result[item.currency] ?? new Prisma.Decimal(0)).plus(item.amount.abs()); return result; }, {});
  const transferByCurrency = sumByCurrency("TRANSFER");
  for (const key of Object.keys(transferByCurrency)) transferByCurrency[key] = transferByCurrency[key].div(2);
  const serializeMap = (values: Record<string, Prisma.Decimal>) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.toString()]));
  const balanceMap = serializeMap(balancesByCurrency);
  const stats: FinanceStats = { totalBalance: Object.keys(balanceMap).length === 1 ? Object.values(balanceMap)[0] : null, balancesByCurrency: balanceMap, monthIncome: serializeMap(sumByCurrency("INCOME")), monthExpense: serializeMap(sumByCurrency("EXPENSE")), monthTransfer: serializeMap(transferByCurrency) };
  const owner = await db.owner.findUnique({ where: { id: ownerId }, select: { currency: true } });
  const rawBudgets = await db.budget.findMany({ where: { ownerId }, include: { allocations: { include: { category: { select: { id: true, name: true } } } } }, orderBy: { month: "desc" } });
  const budgets = rawBudgets.map(serializeBudget);
  const budget = budgets.find((item) => item.month === reportMonth) ?? null;
  const reportTransactions = await db.financialTransaction.findMany({ where: { ownerId, occurredAt: { gte: reportRange.start, lt: reportRange.end }, type: { in: ["INCOME", "EXPENSE"] } }, select: { type: true, amount: true, currency: true, categoryId: true, category: { select: { name: true } } } });
  const aggregateByCurrency = (type: TransactionType) => reportTransactions.filter((item) => item.type === type).reduce<Record<string, Prisma.Decimal>>((result, item) => { result[item.currency] = (result[item.currency] ?? new Prisma.Decimal(0)).plus(item.amount.abs()); return result; }, {});
  const serializeAggregates = (values: Record<string, Prisma.Decimal>) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.toString()]));
  const categoryMap = new Map<string, { categoryId: string | null; categoryName: string; amounts: Record<string, Prisma.Decimal> }>();
  for (const transaction of reportTransactions.filter((item) => item.type === "EXPENSE")) {
    const categoryId = transaction.categoryId;
    const categoryName = transaction.category?.name ?? "Kategorisiz";
    const key = categoryId ?? "uncategorized";
    const item = categoryMap.get(key) ?? { categoryId, categoryName, amounts: {} };
    item.amounts[transaction.currency] = (item.amounts[transaction.currency] ?? new Prisma.Decimal(0)).plus(transaction.amount.abs());
    categoryMap.set(key, item);
  }
  const budgetSpent = budget ? aggregateByCurrency("EXPENSE")[budget.currency] ?? new Prisma.Decimal(0) : new Prisma.Decimal(0);
  const allocationActuals = budget?.allocations.map((allocation) => {
    const spent = categoryMap.get(allocation.categoryId)?.amounts[budget.currency] ?? new Prisma.Decimal(0);
    const planned = new Prisma.Decimal(allocation.amount);
    return { categoryId: allocation.categoryId, spent: spent.toString(), remaining: planned.minus(spent).toString(), percentage: planned.gt(0) ? spent.div(planned).times(100).toNumber() : 0 };
  }) ?? [];
  const report: FinanceReport = { month: reportMonth, budget, budgetSpent: budgetSpent.toString(), budgetRemaining: new Prisma.Decimal(budget?.total ?? "0").minus(budgetSpent).toString(), allocationActuals, incomeByCurrency: serializeAggregates(aggregateByCurrency("INCOME")), expenseByCurrency: serializeAggregates(aggregateByCurrency("EXPENSE")), categoryActuals: [...categoryMap.values()].map((item) => ({ categoryId: item.categoryId, categoryName: item.categoryName, amountsByCurrency: serializeAggregates(item.amounts) })) };
  return { accounts: serializedAccounts, categories: categories.map((category): FinanceCategory => ({ id: category.id, name: category.name, kind: category.kind as "INCOME" | "EXPENSE", color: category.color })), transactions: serializedTransactions, stats, currency: owner?.currency ?? accounts[0]?.currency ?? "TRY", budgets, report };
}

export async function getFinanceTransaction(ownerId: string, id: string) {
  return db.financialTransaction.findFirst({ where: { id, ownerId }, include: { account: true, category: true } });
}
