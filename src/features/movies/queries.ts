import type { MovieStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { MovieListItem, MovieStats } from "./types";

export type MovieListFilters = {
  query?: string;
  status?: MovieStatus;
  favorite?: boolean;
  tagId?: string;
};

function serializeMovie(movie: {
  tags: { tagId: string }[];
  id: string;
  title: string;
  releaseYear: number | null;
  runtimeMins: number | null;
  posterUrl: string | null;
  status: MovieStatus;
  rating: { toString(): string } | null;
  review: string | null;
  watchedAt: Date | null;
  rewatchCount: number;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MovieListItem {
  return {
    id: movie.id,
    tagIds: movie.tags.map((tag) => tag.tagId),
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMins: movie.runtimeMins,
    posterUrl: movie.posterUrl,
    status: movie.status,
    rating: movie.rating?.toString() ?? null,
    review: movie.review,
    watchedAt: movie.watchedAt?.toISOString() ?? null,
    rewatchCount: movie.rewatchCount,
    favorite: movie.favorite,
    createdAt: movie.createdAt.toISOString(),
    updatedAt: movie.updatedAt.toISOString(),
  };
}

export async function getMovies(ownerId: string, filters: MovieListFilters = {}) {
  const query = filters.query?.trim();
  const movies = await db.movie.findMany({
    where: {
      ownerId,
      ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.favorite === true ? { favorite: true } : {}),
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
    },
    include: { tags: { select: { tagId: true } } },
    orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });
  return movies.map(serializeMovie);
}

export async function getMovie(ownerId: string, id: string) {
  const movie = await db.movie.findFirst({ where: { id, ownerId }, include: { tags: { select: { tagId: true } } } });
  return movie ? serializeMovie(movie) : null;
}

export async function getMovieStats(ownerId: string): Promise<MovieStats> {
  const [total, favorites, watching, completed] = await Promise.all([
    db.movie.count({ where: { ownerId } }),
    db.movie.count({ where: { ownerId, favorite: true } }),
    db.movie.count({ where: { ownerId, status: "WATCHING" } }),
    db.movie.count({ where: { ownerId, status: "COMPLETED" } }),
  ]);
  return { total, favorites, watching, completed };
}
