import type { Book, ReadingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { BookListItem, BookStats } from "./types";

export type BookListFilters = { query?: string; status?: ReadingStatus; favorite?: boolean; tagId?: string };

function serializeBook(book: Book & { tags: { tagId: string }[]; sessions?: { id: string; startedAt: Date; endedAt: Date | null; pagesRead: number; note: string | null }[] }): BookListItem {
  return {
    id: book.id,
    tagIds: book.tags.map((tag) => tag.tagId),
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    pageCount: book.pageCount,
    currentPage: book.currentPage,
    genre: book.genre,
    description: book.description,
    publisher: book.publisher,
    publicationYear: book.publicationYear,
    rating: book.rating?.toString() ?? null,
    review: book.review,
    status: book.status,
    favorite: book.favorite,
    startedAt: book.startedAt?.toISOString() ?? null,
    completedAt: book.completedAt?.toISOString() ?? null,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    recentSessions: (book.sessions ?? []).map((session) => ({
      id: session.id,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      pagesRead: session.pagesRead,
      note: session.note,
    })),
  };
}

export async function getBooks(ownerId: string, filters: BookListFilters = {}) {
  const query = filters.query?.trim();
  const books = await db.book.findMany({
    where: {
      ownerId,
      ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.favorite === true ? { favorite: true } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { author: { contains: query, mode: "insensitive" } }, { isbn: { contains: query, mode: "insensitive" } }] } : {}),
    },
    include: { tags: { select: { tagId: true } }, sessions: { orderBy: { startedAt: "desc" }, take: 3 } },
    orderBy: [{ favorite: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });
  return books.map(serializeBook);
}

export async function getBook(ownerId: string, id: string) {
  const book = await db.book.findFirst({ where: { id, ownerId }, include: { tags: { select: { tagId: true } }, sessions: { orderBy: { startedAt: "desc" }, take: 10 } } });
  return book ? serializeBook(book) : null;
}

export async function getBookStats(ownerId: string): Promise<BookStats> {
  const [total, favorites, reading, completed, progress] = await Promise.all([
    db.book.count({ where: { ownerId } }),
    db.book.count({ where: { ownerId, favorite: true } }),
    db.book.count({ where: { ownerId, status: "READING" } }),
    db.book.count({ where: { ownerId, status: "COMPLETED" } }),
    db.book.aggregate({ where: { ownerId }, _sum: { currentPage: true } }),
  ]);
  return { total, favorites, reading, completed, pagesRead: progress._sum.currentPage ?? 0 };
}
