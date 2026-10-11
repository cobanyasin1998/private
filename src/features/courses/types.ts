import type { CourseStatus } from "@prisma/client";

export type CourseLessonItem = { id: string; title: string; position: number; completedAt: string | null; notes: string | null };
export type StudySessionItem = { id: string; startedAt: string; endedAt: string | null; minutes: number; note: string | null };
export type CourseNoteItem = { id: string; courseId: string | null; lessonId: string | null; title: string; content: string; createdAt: string; updatedAt: string };
export type CourseGoalItem = { id: string; title: string; description: string | null; dueDate: string | null; completedAt: string | null };
export type CourseListItem = {
  tagIds: string[];
  id: string; name: string; category: string | null; description: string | null; provider: string | null; externalUrl: string | null;
  status: CourseStatus; progress: number; startedAt: string | null; completedAt: string | null; createdAt: string; updatedAt: string;
  lessons: CourseLessonItem[]; recentSessions: StudySessionItem[]; learningNotes: CourseNoteItem[]; learningGoals: CourseGoalItem[]; totalMinutes: number;
};
export type CourseStats = { total: number; planned: number; inProgress: number; completed: number; averageProgress: number; totalMinutes: number; lessonsCompleted: number; lessonsTotal: number; learningNotes: number; learningGoals: number; completedGoals: number };
