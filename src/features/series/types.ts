import type { MovieStatus } from "@prisma/client";

export type SeriesListItem = {
  id: string; title: string; releaseYear: number | null; posterUrl: string | null;
  status: MovieStatus; rating: string | null; currentEpisode: number; favorite: boolean;
  totalEpisodes: number; watchedEpisodes: number; completionPercent: number;
  createdAt: string; updatedAt: string;
};

export type SeriesSeason = {
  id: string; number: number; title: string | null;
  episodes: { id: string; number: number; title: string; watchedAt: string | null }[];
};

export type SeriesDetail = SeriesListItem & { seasons: SeriesSeason[]; watchEntries: { id: string; watchedAt: string; note: string | null }[] };
export type SeriesStats = { total: number; favorites: number; watching: number; completed: number; episodes: number; watchedEpisodes: number };
