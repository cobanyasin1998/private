import type { MovieStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { SeriesDetail, SeriesListItem, SeriesSeason, SeriesStats } from "./types";

export type SeriesListFilters = { query?: string; status?: MovieStatus; favorite?: boolean };

function serializeSeries(series: {
  id: string; title: string; releaseYear: number | null; posterUrl: string | null; status: MovieStatus;
  rating: { toString(): string } | null; currentEpisode: number; favorite: boolean; createdAt: Date; updatedAt: Date;
  seasons: { episodes: { id: string; watchedAt: Date | null }[] }[];
}): SeriesListItem {
  const episodes = series.seasons.flatMap((season) => season.episodes);
  const watchedEpisodes = episodes.filter((episode) => episode.watchedAt !== null).length;
  const totalEpisodes = episodes.length;
  return { id: series.id, title: series.title, releaseYear: series.releaseYear, posterUrl: series.posterUrl, status: series.status, rating: series.rating?.toString() ?? null, currentEpisode: series.currentEpisode, favorite: series.favorite, totalEpisodes, watchedEpisodes, completionPercent: totalEpisodes ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0, createdAt: series.createdAt.toISOString(), updatedAt: series.updatedAt.toISOString() };
}

export async function getSeries(ownerId: string, filters: SeriesListFilters = {}): Promise<SeriesListItem[]> {
  const query = filters.query?.trim();
  const rows = await db.tVSeries.findMany({ where: { ownerId, ...(query ? { title: { contains: query, mode: "insensitive" } } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.favorite === true ? { favorite: true } : {}) }, include: { seasons: { include: { episodes: { select: { id: true, watchedAt: true } } } } }, orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }], take: 200 });
  return rows.map(serializeSeries);
}

export async function getSeriesDetail(ownerId: string, id: string): Promise<SeriesDetail | null> {
  const row = await db.tVSeries.findFirst({ where: { id, ownerId }, include: { seasons: { orderBy: { number: "asc" }, include: { episodes: { orderBy: { number: "asc" } } } }, watchEntries: { orderBy: { watchedAt: "desc" }, take: 50 } } });
  if (!row) return null;
  const summary = serializeSeries({ ...row, seasons: row.seasons.map((season) => ({ episodes: season.episodes.map((episode) => ({ id: episode.id, watchedAt: episode.watchedAt })) })) });
  const seasons: SeriesSeason[] = row.seasons.map((season) => ({ id: season.id, number: season.number, title: season.title, episodes: season.episodes.map((episode) => ({ id: episode.id, number: episode.number, title: episode.title, watchedAt: episode.watchedAt?.toISOString() ?? null })) }));
  return { ...summary, seasons, watchEntries: row.watchEntries.map((entry) => ({ id: entry.id, watchedAt: entry.watchedAt.toISOString(), note: entry.note })) };
}

export async function getSeriesStats(ownerId: string): Promise<SeriesStats> {
  const [total, favorites, watching, completed, episodes, watchedEpisodes] = await Promise.all([
    db.tVSeries.count({ where: { ownerId } }), db.tVSeries.count({ where: { ownerId, favorite: true } }), db.tVSeries.count({ where: { ownerId, status: "WATCHING" } }), db.tVSeries.count({ where: { ownerId, status: "COMPLETED" } }),
    db.tVEpisode.count({ where: { season: { series: { ownerId } } } }), db.tVEpisode.count({ where: { season: { series: { ownerId } }, watchedAt: { not: null } } }),
  ]);
  return { total, favorites, watching, completed, episodes, watchedEpisodes };
}
