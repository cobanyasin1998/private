import { redirect } from "next/navigation";
import { getSessionOwner } from "@/lib/auth/session";
import { getMovieStats, getMovies } from "@/features/movies/queries";
import { MovieLibrary } from "@/features/movies/components/movie-library";
import type { MovieStatus } from "@prisma/client";

const validStatuses = new Set<MovieStatus>(["PLANNED", "WATCHING", "COMPLETED", "DROPPED"]);

type SearchParams = { q?: string; tag?: string; status?: string; favorite?: string };

export default async function MoviesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const owner = await getSessionOwner();
  if (!owner) redirect("/login?next=%2Fmovies");
  const params = await searchParams; const tagId = typeof params?.tag === "string" ? params.tag : "";
  const query = typeof params?.q === "string" ? params.q : "";
  const rawStatus = typeof params?.status === "string" ? params.status : "";
  const status = validStatuses.has(rawStatus as MovieStatus) ? rawStatus as MovieStatus : undefined;
  const favorite = params?.favorite === "1" || params?.favorite === "true";
  const [movies, stats] = await Promise.all([getMovies(owner.id, { query, status, favorite, tagId }), getMovieStats(owner.id)]);
  return <MovieLibrary movies={movies} stats={stats} query={query} tagId={tagId} status={status ?? ""} favorite={favorite} />;
}
