import { redirect } from "next/navigation";
import type { ReadingStatus } from "@prisma/client";
import { getSessionOwner } from "@/lib/auth/session";
import { getBookStats, getBooks } from "@/features/books/queries";
import { BookLibrary } from "@/features/books/components/book-library";

const validStatuses = new Set<ReadingStatus>(["WANT_TO_READ", "READING", "COMPLETED", "PAUSED", "DROPPED"]);
type SearchParams = { q?: string; tag?: string; status?: string; favorite?: string };
export default async function BooksPage({ searchParams }: { searchParams?: Promise<SearchParams> }) { const owner = await getSessionOwner(); if (!owner) redirect("/login?next=%2Fbooks"); const params = await searchParams; const tagId = typeof params?.tag === "string" ? params.tag : ""; const query = typeof params?.q === "string" ? params.q : ""; const rawStatus = typeof params?.status === "string" ? params.status : ""; const status = validStatuses.has(rawStatus as ReadingStatus) ? rawStatus as ReadingStatus : undefined; const favorite = params?.favorite === "1" || params?.favorite === "true"; const [books, stats] = await Promise.all([getBooks(owner.id, { query, status, favorite, tagId }), getBookStats(owner.id)]); return <BookLibrary books={books} stats={stats} query={query} tagId={tagId} status={status ?? ""} favorite={favorite} />; }
