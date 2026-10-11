import { db } from "@/lib/db";
import type { TagEntityType, TagItem } from "./types";

export async function getTags(ownerId: string): Promise<TagItem[]> {
  const tags = await db.tag.findMany({
    where: { ownerId },
    include: { _count: { select: { movies: true, books: true, courses: true, notes: true, learningAreas: true, learningItems: true, travelPlaces: true } } },
    orderBy: [{ name: "asc" }],
  });
  return tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color, createdAt: tag.createdAt.toISOString(), usageCount: tag._count.movies + tag._count.books + tag._count.courses + tag._count.notes + tag._count.learningAreas + tag._count.learningItems + tag._count.travelPlaces }));
}

export async function getEntityTagIds(ownerId: string, entityType: TagEntityType, entityId: string): Promise<string[]> {
  if (entityType === "movie") { const rows = await db.movieTag.findMany({ where: { movieId: entityId, movie: { ownerId } }, select: { tagId: true } }); return rows.map((row) => row.tagId); }
  if (entityType === "book") { const rows = await db.bookTag.findMany({ where: { bookId: entityId, book: { ownerId } }, select: { tagId: true } }); return rows.map((row) => row.tagId); }
  if (entityType === "course") { const rows = await db.courseTag.findMany({ where: { courseId: entityId, course: { ownerId } }, select: { tagId: true } }); return rows.map((row) => row.tagId); }
  const rows = await db.noteTag.findMany({ where: { noteId: entityId, note: { ownerId } }, select: { tagId: true } }); return rows.map((row) => row.tagId);
}

