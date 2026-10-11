import type { AccountType, TransactionType } from "@prisma/client";

export type FinanceAccount = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: string;
  balance: string;
  archived: boolean;
};

export type FinanceCategory = { id: string; name: string; kind: "INCOME" | "EXPENSE"; color: string | null };

export type FinanceTransaction = {
  id: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  occurredAt: string;
  description: string;
  transferGroup: string | null;
  recurring: boolean;
};

export type FinanceStats = {
  totalBalance: string | null;
  balancesByCurrency: Record<string, string>;
  monthIncome: Record<string, string>;
  monthExpense: Record<string, string>;
  monthTransfer: Record<string, string>;
};

export type FinanceBudgetAllocation = { id: string; categoryId: string; categoryName: string; amount: string };
export type FinanceBudget = { id: string; month: string; name: string; currency: string; allocations: FinanceBudgetAllocation[]; total: string };
export type FinanceReport = {
  month: string;
  budget: FinanceBudget | null;
  budgetSpent: string;
  budgetRemaining: string;
  allocationActuals: Array<{ categoryId: string; spent: string; remaining: string; percentage: number }>;
  incomeByCurrency: Record<string, string>;
  expenseByCurrency: Record<string, string>;
  categoryActuals: Array<{ categoryId: string | null; categoryName: string; amountsByCurrency: Record<string, string> }>;
};

export type FinanceData = {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  stats: FinanceStats;
  currency: string;
  budgets: FinanceBudget[];
  report: FinanceReport;
};
