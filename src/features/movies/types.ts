import type { MovieStatus } from "@prisma/client";

export type MovieListItem = {
  tagIds: string[];
  id: string;
  title: string;
  releaseYear: number | null;
  runtimeMins: number | null;
  posterUrl: string | null;
  status: MovieStatus;
  rating: string | null;
  review: string | null;
  watchedAt: string | null;
  rewatchCount: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MovieStats = {
  total: number;
  favorites: number;
  watching: number;
  completed: number;
};
