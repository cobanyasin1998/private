"use client";

import { useState } from "react";
import { BarChart3, Download, Trash2 } from "lucide-react";
import type { FinanceBudget, FinanceCategory, FinanceReport } from "../types";
import { getFinanceMessages } from "../messages";

function formatAmount(value: string, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(value));
}

function currencyMap(values: Record<string, string>, fallback: string, locale: string) {
  const entries = Object.entries(values);
  return entries.length ? entries.map(([currency, amount]) => formatAmount(amount, currency, locale)).join(" · ") : formatAmount("0", fallback, locale);
}

function monthLabel(month: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
}

type Props = {
  locale: string;
  budgets: FinanceBudget[];
  report: FinanceReport;
  reportMonth: string;
  categories: FinanceCategory[];
  currency: string;
  pending: boolean;
  onSave: (input: unknown) => void;
  onDelete: (id: string) => void;
  exportParams: Record<string, string>;
};

export function BudgetReportSection({ locale, budgets, report, reportMonth, categories, currency, pending, onSave, onDelete, exportParams }: Props) {
  const t = getFinanceMessages(locale);
  const [editing, setEditing] = useState(false);
  const budget = report.budget;
  const exportQuery = new URLSearchParams(Object.entries(exportParams).filter(([, value]) => value)).toString();
  return <section id="budget-report" className="space-y-4">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 size={19} className="text-primary" /> {t.reportTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{monthLabel(report.month, t.locale)} · {t.reportScope}</p></div>
      <div className="flex flex-wrap gap-2">
        <form method="get" className="flex gap-2"><label className="sr-only" htmlFor="report-month">{t.reportMonth}</label><input id="report-month" name="month" type="month" required defaultValue={reportMonth} className="h-10 rounded-lg border bg-background px-3 text-sm" /><button className="h-10 rounded-lg border px-3 text-sm font-medium hover:bg-muted">{t.show}</button></form>
        <a href={`/api/finance/export?${exportQuery}`} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"><Download size={15} /> {t.csv}</a>
      </div>
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{budget?.name ?? t.createBudget}</h3><p className="mt-1 text-xs text-muted-foreground">{budget ? `${t.currencyLabel}: ${budget.currency}` : t.createHint}</p></div><button type="button" onClick={() => setEditing((value) => !value)} className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-muted">{editing ? t.closeForm : budget ? t.editBudget : t.addBudget}</button></div>
        {budget && <>
          <dl className="mt-5 grid grid-cols-3 gap-3"><div><dt className="text-xs text-muted-foreground">{t.planned}</dt><dd className="mt-1 text-sm font-semibold">{formatAmount(budget.total, budget.currency, t.locale)}</dd></div><div><dt className="text-xs text-muted-foreground">{t.spent}</dt><dd className="mt-1 text-sm font-semibold">{formatAmount(report.budgetSpent, budget.currency, t.locale)}</dd></div><div><dt className="text-xs text-muted-foreground">{t.remaining}</dt><dd className={`mt-1 text-sm font-semibold ${Number(report.budgetRemaining) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatAmount(report.budgetRemaining, budget.currency, t.locale)}</dd></div></dl>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t.spendHint(budget.currency)}</p>
          <div className="mt-5 space-y-4">{budget.allocations.map((allocation) => {
            const actual = report.allocationActuals.find((item) => item.categoryId === allocation.categoryId);
            const percentage = actual?.percentage ?? 0;
            return <div key={allocation.id}><div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium">{allocation.categoryName}</span><span className="text-muted-foreground">{formatAmount(actual?.spent ?? "0", budget.currency, t.locale)} / {formatAmount(allocation.amount, budget.currency, t.locale)}</span></div><div role="progressbar" aria-label={t.usage(allocation.categoryName)} aria-valuenow={Math.min(100, Math.round(percentage))} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${percentage > 100 ? "bg-rose-500" : "bg-primary"}`} style={{ width: `${Math.min(100, percentage)}%` }} /></div><p className="mt-1 text-right text-xs text-muted-foreground">{t.used(Math.round(percentage))}</p></div>;
          })}{budget.allocations.length === 0 && <p className="text-sm text-muted-foreground">{t.noAllocations}</p>}</div>
        </>}
        {(editing || !budget) && <BudgetForm locale={locale} key={budget?.id ?? reportMonth} budget={budget} month={reportMonth} currency={currency} categories={categories} pending={pending} onSave={onSave} />}
        {budget && <button type="button" disabled={pending} onClick={() => onDelete(budget.id)} className="mt-5 inline-flex items-center gap-1.5 text-xs text-rose-600 hover:underline disabled:opacity-50"><Trash2 size={13} /> {t.deleteBudget}</button>}
      </div>
      <div className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{t.summary}</h3><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-emerald-500/10 p-3"><dt className="text-xs text-muted-foreground">{t.income}</dt><dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{currencyMap(report.incomeByCurrency, currency, t.locale)}</dd></div><div className="rounded-lg bg-rose-500/10 p-3"><dt className="text-xs text-muted-foreground">{t.expense}</dt><dd className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">{currencyMap(report.expenseByCurrency, currency, t.locale)}</dd></div></dl><h4 className="mt-5 text-sm font-medium">{t.expenseCategories}</h4><div className="mt-2 divide-y">{report.categoryActuals.map((item) => <div key={item.categoryId ?? "uncategorized"} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="text-muted-foreground">{item.categoryId ? item.categoryName : t.uncategorized}</span><span className="font-medium">{currencyMap(item.amountsByCurrency, currency, t.locale)}</span></div>)}{report.categoryActuals.length === 0 && <p className="py-4 text-sm text-muted-foreground">{t.noExpenses}</p>}</div>{budgets.length > 1 && <p className="mt-4 text-xs text-muted-foreground">{t.budgetHistory(budgets.length)}</p>}<p className="mt-5 text-xs leading-5 text-muted-foreground">{t.csvHint}</p></div>
    </div>
  </section>;
}

function BudgetForm({ locale, budget, month, currency, categories, pending, onSave }: { locale: string; budget: FinanceBudget | null; month: string; currency: string; categories: FinanceCategory[]; pending: boolean; onSave: (input: unknown) => void }) {
  const t = getFinanceMessages(locale);
  const expenseCategories = categories.filter((category) => category.kind === "EXPENSE");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const allocations = expenseCategories.map((category) => ({ categoryId: category.id, amount: String(form.get(`allocation-${category.id}`) ?? "").trim() })).filter((item) => item.amount);
    onSave({ month, name: String(form.get("name") ?? ""), currency: String(form.get("currency") ?? ""), allocations });
  }
  return <form onSubmit={submit} className="mt-5 space-y-3 border-t pt-5"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]"><label className="text-sm font-medium">{t.budgetName}<input required name="name" maxLength={120} defaultValue={budget?.name ?? t.defaultBudgetName(monthLabel(month, t.locale))} className="form-input" /></label><label className="text-sm font-medium">{t.currency}<input required name="currency" maxLength={3} defaultValue={budget?.currency ?? currency} className="form-input uppercase" /></label></div><p className="text-xs leading-5 text-muted-foreground">{t.allocationHint(monthLabel(month, t.locale))}</p><div className="grid gap-3 sm:grid-cols-2">{expenseCategories.map((category) => <label key={category.id} className="text-sm font-medium">{category.name}<input name={`allocation-${category.id}`} inputMode="decimal" defaultValue={budget?.allocations.find((allocation) => allocation.categoryId === category.id)?.amount ?? ""} placeholder="0,00" className="form-input" /></label>)}</div>{expenseCategories.length === 0 && <p className="text-xs text-muted-foreground">{t.categoryHint}</p>}<button disabled={pending} className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? t.saving : t.saveBudget}</button></form>;
}
