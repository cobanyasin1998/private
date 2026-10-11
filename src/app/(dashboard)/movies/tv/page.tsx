import type { MovieStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { getSeries, getSeriesStats } from "@/features/series/queries";
import { SeriesLibrary } from "@/features/series/components/series-library";

const validStatuses = new Set<MovieStatus>(["PLANNED", "WATCHING", "COMPLETED", "DROPPED"]);
type SearchParams = { q?: string; status?: string; favorite?: string };

export default async function TVPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/login?next=%2Fmovies%2Ftv");
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q : "";
  const rawStatus = typeof params?.status === "string" ? params.status : "";
  const status = validStatuses.has(rawStatus as MovieStatus) ? rawStatus as MovieStatus : undefined;
  const favorite = params?.favorite === "1" || params?.favorite === "true";
  const [series, stats] = await Promise.all([getSeries(owner.id, { query, status, favorite }), getSeriesStats(owner.id)]);
  return <SeriesLibrary series={series} stats={stats} query={query} status={status ?? ""} favorite={favorite} />;
}
