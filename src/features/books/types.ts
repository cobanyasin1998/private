import type { ReadingStatus } from "@prisma/client";

export type BookListItem = {
  tagIds: string[];
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  currentPage: number;
  genre: string | null;
  description: string | null;
  publisher: string | null;
  publicationYear: number | null;
  rating: string | null;
  review: string | null;
  status: ReadingStatus;
  favorite: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  recentSessions: ReadingSessionListItem[];
};

export type ReadingSessionListItem = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  pagesRead: number;
  note: string | null;
};

export type BookStats = {
  total: number;
  favorites: number;
  reading: number;
  completed: number;
  pagesRead: number;
};
