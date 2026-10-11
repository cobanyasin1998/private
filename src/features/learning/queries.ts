import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { EnglishSkillProgressItem, LearningAreaListItem, LearningEnglishEntryItem, LearningGoalItem, LearningItemListItem, LearningNoteItem, LearningStats, LearningStudySessionItem, LearningTodoItem, TravelPlaceListItem } from "./types";

export type LearningAreaListFilters = {
  query?: string;
  group?: "TECHNOLOGY" | "ACADEMIC" | "PERSONAL_LIFE";
  status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  sort?: "updated" | "name" | "progress" | "lastWorked";
};

type AreaWithRelations = Prisma.LearningAreaGetPayload<{
  include: {
    tags: { select: { tagId: true } };
    items: { include: { tags: { select: { tagId: true } }; todos: true; learningNotes: true; learningGoals: true } };
    sessions: true;
    learningNotes: true;
    learningGoals: true;
    englishSkills: true;
    englishEntries: true;
    todos: true;
  };
}>;

type ItemWithRelations = Prisma.LearningItemGetPayload<{
  include: { tags: { select: { tagId: true } }; todos: true; learningNotes: true; learningGoals: true };
}>;

function serializeItem(item: ItemWithRelations): LearningItemListItem {
  return {
    id: item.id, areaId: item.areaId, parentId: item.parentId, title: item.title, description: item.description, summary: item.summary, content: item.content, requirements: item.requirements, goals: item.goals, type: item.type, position: item.position,
    estimatedMinutes: item.estimatedMinutes, notes: item.notes, externalUrl: item.externalUrl, completedAt: item.completedAt?.toISOString() ?? null,
    tagIds: item.tags.map((tag) => tag.tagId), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
    todos: item.todos.map((todo) => ({ id: todo.id, areaId: todo.areaId, itemId: todo.itemId, title: todo.title, description: todo.description, status: todo.status, priority: todo.priority, dueDate: todo.dueDate?.toISOString() ?? null, completedAt: todo.completedAt?.toISOString() ?? null, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() })),
    learningNotes: item.learningNotes.map((note) => ({ id: note.id, title: note.title, content: note.content, learningAreaId: note.learningAreaId, learningItemId: note.learningItemId, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() })),
    learningGoals: item.learningGoals.map((goal) => ({ id: goal.id, title: goal.title, description: goal.description, learningAreaId: goal.learningAreaId, learningItemId: goal.learningItemId, dueDate: goal.dueDate?.toISOString() ?? null, completedAt: goal.completedAt?.toISOString() ?? null })),
  };
}

function serializeArea(area: AreaWithRelations): LearningAreaListItem {
  const items: LearningItemListItem[] = area.items.map(serializeItem);
  const sessions: LearningStudySessionItem[] = area.sessions.map((session) => ({ id: session.id, startedAt: session.startedAt.toISOString(), endedAt: session.endedAt?.toISOString() ?? null, minutes: session.minutes, note: session.note }));
  const learningNotes: LearningNoteItem[] = area.learningNotes.map((note) => ({ id: note.id, title: note.title, content: note.content, learningAreaId: note.learningAreaId, learningItemId: note.learningItemId, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() }));
  const learningGoals: LearningGoalItem[] = area.learningGoals.map((goal) => ({ id: goal.id, title: goal.title, description: goal.description, learningAreaId: goal.learningAreaId, learningItemId: goal.learningItemId, dueDate: goal.dueDate?.toISOString() ?? null, completedAt: goal.completedAt?.toISOString() ?? null }));
  const todos: LearningTodoItem[] = area.todos.map((todo) => ({ id: todo.id, areaId: todo.areaId, itemId: todo.itemId, title: todo.title, description: todo.description, status: todo.status, priority: todo.priority, dueDate: todo.dueDate?.toISOString() ?? null, completedAt: todo.completedAt?.toISOString() ?? null, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() }));
  const englishSkills: EnglishSkillProgressItem[] = area.englishSkills.map((skill) => ({ id: skill.id, areaId: skill.areaId, skill: skill.skill, level: skill.level, progress: skill.progress, assessedAt: skill.assessedAt?.toISOString() ?? null }));
  const englishEntries: LearningEnglishEntryItem[] = area.englishEntries.map((entry) => ({ id: entry.id, areaId: entry.areaId, type: entry.type, title: entry.title, content: entry.content, notes: entry.notes, progress: entry.progress, completedAt: entry.completedAt?.toISOString() ?? null, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() }));
  return {
    id: area.id, ownerId: area.ownerId, slug: area.slug, name: area.name, description: area.description, group: area.group,
    category: area.category, subCategory: area.subCategory, level: area.level, status: area.status, progress: area.progress,
    estimatedMinutes: area.estimatedMinutes, prerequisites: area.prerequisites, notes: area.notes, resourceUrls: area.resourceUrls,
    lastWorkedAt: area.lastWorkedAt?.toISOString() ?? null, completedAt: area.completedAt?.toISOString() ?? null, englishLevel: area.englishLevel,
    tagIds: area.tags.map((tag) => tag.tagId), items, todos, sessions, learningNotes, learningGoals, englishSkills, englishEntries,
    totalMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0), completedItems: items.filter((item) => item.completedAt !== null).length,
    createdAt: area.createdAt.toISOString(), updatedAt: area.updatedAt.toISOString(),
  };
}

const areaInclude = {
  tags: { select: { tagId: true } },
  items: { include: { tags: { select: { tagId: true } }, todos: true, learningNotes: true, learningGoals: true }, orderBy: { position: "asc" as const } },
  todos: { orderBy: [{ status: "asc" as const }, { dueDate: "asc" as const }, { updatedAt: "desc" as const }], take: 300 },
  sessions: { orderBy: { startedAt: "desc" as const }, take: 100 },
  learningNotes: { orderBy: { updatedAt: "desc" as const }, take: 100 },
  learningGoals: { orderBy: [{ completedAt: "asc" as const }, { dueDate: "asc" as const }], take: 100 },
  englishSkills: { orderBy: { skill: "asc" as const } },
  englishEntries: { orderBy: { updatedAt: "desc" as const }, take: 100 },
};

export async function getLearningAreas(ownerId: string, filters: LearningAreaListFilters = {}) {
  const query = filters.query?.trim();
  const where: Prisma.LearningAreaWhereInput = {
    ownerId,
    ...(filters.group ? { group: filters.group } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.level ? { level: filters.level } : {}),
    ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }, { subCategory: { contains: query, mode: "insensitive" } }] } : {}),
  };
  const orderBy: Prisma.LearningAreaOrderByWithRelationInput = filters.sort === "name" ? { name: "asc" } : filters.sort === "progress" ? { progress: "desc" } : filters.sort === "lastWorked" ? { lastWorkedAt: "desc" } : { updatedAt: "desc" };
  const areas = await db.learningArea.findMany({ where, include: areaInclude, orderBy, take: 300 });
  return areas.map((area) => serializeArea(area));
}

export async function getLearningArea(ownerId: string, id: string) {
  const area = await db.learningArea.findFirst({ where: { id, ownerId }, include: areaInclude });
  return area ? serializeArea(area) : null;
}

/** Fetch one owner-scoped learning area for its stable Turkish route slug. */
export async function getLearningAreaBySlug(ownerId: string, slug: string) {
  const area = await db.learningArea.findFirst({ where: { slug, ownerId }, include: areaInclude });
  return area ? serializeArea(area) : null;
}

/** Fetch one owner-scoped topic with its rich content and item-level records. */
export async function getLearningItem(ownerId: string, id: string, areaId?: string) {
  const item = await db.learningItem.findFirst({ where: { id, ownerId, ...(areaId ? { areaId } : {}) }, include: { tags: { select: { tagId: true } }, todos: true, learningNotes: { orderBy: { updatedAt: "desc" } }, learningGoals: { orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }] } } });
  return item ? serializeItem(item) : null;
}

export async function getLearningStats(ownerId: string): Promise<LearningStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalAreas, activeAreas, completedAreas, average, totalItems, completedItems, totalSession, weeklySession, upcomingGoals] = await Promise.all([
    db.learningArea.count({ where: { ownerId } }),
    db.learningArea.count({ where: { ownerId, status: "IN_PROGRESS" } }),
    db.learningArea.count({ where: { ownerId, status: "COMPLETED" } }),
    db.learningArea.aggregate({ where: { ownerId }, _avg: { progress: true } }),
    db.learningItem.count({ where: { ownerId } }),
    db.learningItem.count({ where: { ownerId, completedAt: { not: null } } }),
    db.learningStudySession.aggregate({ where: { ownerId }, _sum: { minutes: true } }),
    db.learningStudySession.aggregate({ where: { ownerId, startedAt: { gte: since } }, _sum: { minutes: true } }),
    db.goal.count({ where: { ownerId, learningAreaId: { not: null }, learningArea: { ownerId }, completedAt: null, dueDate: { not: null } } }),
  ]);
  return { totalAreas, activeAreas, completedAreas, averageProgress: Math.round(average._avg.progress ?? 0), totalMinutes: totalSession._sum.minutes ?? 0, completedItems, totalItems, weeklyMinutes: weeklySession._sum.minutes ?? 0, upcomingGoals };
}

function serializeTravel(place: Prisma.TravelPlaceGetPayload<{ include: { tags: { select: { tagId: true } } } }>): TravelPlaceListItem {
  return {
    id: place.id, placeName: place.placeName, city: place.city, country: place.country, status: place.status, priority: place.priority,
    estimatedBudget: place.estimatedBudget ? Number(place.estimatedBudget) : null, currency: place.currency, notes: place.notes, photoUrl: place.photoUrl,
    externalUrl: place.externalUrl, visitedAt: place.visitedAt?.toISOString() ?? null, tagIds: place.tags.map((tag) => tag.tagId), createdAt: place.createdAt.toISOString(), updatedAt: place.updatedAt.toISOString(),
  };
}

export async function getTravelPlaces(ownerId: string, filters: { query?: string; status?: "WISHLIST" | "VISITED"; priority?: "LOW" | "MEDIUM" | "HIGH" } = {}) {
  const query = filters.query?.trim();
  const places = await db.travelPlace.findMany({ where: { ownerId, ...(filters.status ? { status: filters.status } : {}), ...(filters.priority ? { priority: filters.priority } : {}), ...(query ? { OR: [{ placeName: { contains: query, mode: "insensitive" } }, { city: { contains: query, mode: "insensitive" } }, { country: { contains: query, mode: "insensitive" } }] } : {}) }, include: { tags: { select: { tagId: true } } }, orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }], take: 300 });
  return places.map(serializeTravel);
}

export async function getTravelPlace(ownerId: string, id: string) {
  const place = await db.travelPlace.findFirst({ where: { ownerId, id }, include: { tags: { select: { tagId: true } } } });
  return place ? serializeTravel(place) : null;
}
