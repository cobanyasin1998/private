import type { Course, CourseStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { CourseListItem, CourseStats } from "./types";

export type CourseListFilters = { query?: string; status?: CourseStatus; category?: string; tagId?: string };

type CourseWithRelations = Course & {
  tags: { tagId: string }[];
  lessons: { id: string; title: string; position: number; completedAt: Date | null; notes: string | null }[];
  sessions: { id: string; startedAt: Date; endedAt: Date | null; minutes: number; note: string | null }[];
  learningNotes: { id: string; courseId: string | null; lessonId: string | null; title: string; content: string; createdAt: Date; updatedAt: Date }[];
  learningGoals: { id: string; title: string; description: string | null; dueDate: Date | null; completedAt: Date | null }[];
};
function serializeCourse(course: CourseWithRelations): CourseListItem {
  return {
    tagIds: course.tags.map((tag) => tag.tagId),
    id: course.id, name: course.name, category: course.category, description: course.description, provider: course.provider, externalUrl: course.externalUrl,
    status: course.status, progress: course.progress, startedAt: course.startedAt?.toISOString() ?? null, completedAt: course.completedAt?.toISOString() ?? null,
    createdAt: course.createdAt.toISOString(), updatedAt: course.updatedAt.toISOString(),
    lessons: course.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, position: lesson.position, completedAt: lesson.completedAt?.toISOString() ?? null, notes: lesson.notes })),
    recentSessions: course.sessions.map((session) => ({ id: session.id, startedAt: session.startedAt.toISOString(), endedAt: session.endedAt?.toISOString() ?? null, minutes: session.minutes, note: session.note })),
    learningNotes: course.learningNotes.map((note) => ({ id: note.id, courseId: note.courseId, lessonId: note.lessonId, title: note.title, content: note.content, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() })),
    learningGoals: course.learningGoals.map((goal) => ({ id: goal.id, title: goal.title, description: goal.description, dueDate: goal.dueDate?.toISOString() ?? null, completedAt: goal.completedAt?.toISOString() ?? null })),
    totalMinutes: course.sessions.reduce((sum, session) => sum + session.minutes, 0),
  };
}

export async function getCourses(ownerId: string, filters: CourseListFilters = {}) {
  const query = filters.query?.trim();
  const courses = await db.course.findMany({
    where: { ownerId, ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.category ? { category: filters.category } : {}), ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { provider: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }] } : {}) },
    include: { tags: { select: { tagId: true } }, lessons: { orderBy: { position: "asc" }, take: 200 }, sessions: { orderBy: { startedAt: "desc" }, take: 50 }, learningNotes: { orderBy: { updatedAt: "desc" }, take: 50 }, learningGoals: { orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }], take: 50 } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 200,
  });
  return courses.map((course) => serializeCourse(course));
}

export async function getCourse(ownerId: string, id: string) {
  const course = await db.course.findFirst({ where: { id, ownerId }, include: { tags: { select: { tagId: true } }, lessons: { orderBy: { position: "asc" }, take: 200 }, sessions: { orderBy: { startedAt: "desc" }, take: 50 }, learningNotes: { orderBy: { updatedAt: "desc" }, take: 50 }, learningGoals: { orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }], take: 50 } } });
  return course ? serializeCourse(course) : null;
}

export async function getCourseStats(ownerId: string): Promise<CourseStats> {
  const [total, planned, inProgress, completed, aggregate, lessons, learningNotes, learningGoals, completedGoals] = await Promise.all([
    db.course.count({ where: { ownerId } }), db.course.count({ where: { ownerId, status: "PLANNED" } }), db.course.count({ where: { ownerId, status: "IN_PROGRESS" } }), db.course.count({ where: { ownerId, status: "COMPLETED" } }),
    db.course.aggregate({ where: { ownerId }, _avg: { progress: true } }), db.courseLesson.findMany({ where: { course: { ownerId } }, select: { completedAt: true } }), db.note.count({ where: { ownerId, courseId: { not: null } } }), db.goal.count({ where: { ownerId, courseId: { not: null } } }), db.goal.count({ where: { ownerId, courseId: { not: null }, completedAt: { not: null } } }),
  ]);
  const sessions = await db.studySession.aggregate({ where: { course: { ownerId } }, _sum: { minutes: true } });
  return { total, planned, inProgress, completed, averageProgress: Math.round(aggregate._avg.progress ?? 0), totalMinutes: sessions._sum.minutes ?? 0, lessonsCompleted: lessons.filter((lesson) => lesson.completedAt !== null).length, lessonsTotal: lessons.length, learningNotes, learningGoals, completedGoals };
}
