import { NextRequest, NextResponse } from "next/server";
import { getSessionOwner } from "@/lib/auth/session";
import { db } from "@/lib/db";

function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  return { gte: new Date(Date.UTC(year, monthNumber - 1, 1)), lt: new Date(Date.UTC(year, monthNumber, 1)) };
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const month = params.get("month");
  const range = month ? monthRange(month) : null;
  if (month && !range) return NextResponse.json({ error: "Geçersiz ay." }, { status: 422 });
  const transactions = await db.financialTransaction.findMany({
    where: { ownerId: owner.id, ...(params.get("q") ? { description: { contains: params.get("q") as string, mode: "insensitive" } } : {}), ...(params.get("accountId") ? { accountId: params.get("accountId") as string } : {}), ...(type === "INCOME" || type === "EXPENSE" ? { type } : {}), ...(range ? { occurredAt: range } : {}) },
    include: { account: { select: { name: true } }, category: { select: { name: true } } },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });
  const header = ["Tarih", "Tür", "Hesap", "Kategori", "Tutar", "Para birimi", "Açıklama", "Yinelenen"];
  const kindLabels: Record<string, string> = { INCOME: "Gelir", EXPENSE: "Gider", TRANSFER: "Transfer" };
  const rows = transactions.map((transaction) => [
    transaction.occurredAt.toISOString().slice(0, 10),
    kindLabels[transaction.type] ?? transaction.type,
    transaction.account.name,
    transaction.category?.name ?? "",
    transaction.amount.toString(),
    transaction.currency,
    transaction.description,
    transaction.recurring ? "Evet" : "Hayır",
  ]);
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  const suffix = month ? `-${month}` : "";
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="finance${suffix}.csv"`, "cache-control": "private, no-store" } });
}
