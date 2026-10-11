import { redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { getFinanceData } from "@/features/finance/queries";
import { FinancePanel } from "@/features/finance/components/finance-panel";

type SearchParams = { q?: string; type?: string; accountId?: string; month?: string };
export default async function FinancePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/login?next=%2Ffinance");
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q : "";
  const type = params?.type === "INCOME" || params?.type === "EXPENSE" ? params.type : "";
  const accountId = typeof params?.accountId === "string" ? params.accountId : "";
  const month = typeof params?.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) ? params.month : "";
  const data = await getFinanceData(owner.id, { query, type: type || undefined, accountId: accountId || undefined, month: month || undefined });
  return <FinancePanel {...data} locale={owner.locale} query={query} type={type} accountId={accountId} reportMonth={month || data.report.month} />;
}
