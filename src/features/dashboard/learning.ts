import { db } from "@/lib/db";

export type ActiveLearningItem = {
  id: string;
  name: string;
  category: string | null;
  progress: number;
  updatedAt: Date;
};

export type UpcomingLearningGoal = {
  id: string;
  title: string;
  dueDate: Date;
  course: { id: string; name: string } | null;
};

export type LearningDashboardData = {
  activeLearning: ActiveLearningItem[];
  weeklyStudyMinutes: number;
  upcomingGoals: UpcomingLearningGoal[];
  weekStart: Date;
  weekEnd: Date;
};

function localDateTimeFormatter(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  }
}

function localParts(date: Date, timeZone: string) {
  return Object.fromEntries(localDateTimeFormatter(timeZone).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function localCalendarDate(date: Date, timeZone: string) {
  const parts = localParts(date, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

/** Convert a calendar midnight to its actual instant, including DST offsets. */
function calendarMidnight(calendarDate: Date, timeZone: string) {
  const wallClock = calendarDate.getTime();
  let instant = wallClock;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = localParts(new Date(instant), timeZone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const difference = wallClock - represented;
    instant += difference;
    if (difference === 0) break;
  }
  return new Date(instant);
}

/** Owner-local week, independent of the server's timezone; end is exclusive. */
export function getLearningWeekBounds(date: Date, weekStartsOn = 1, timeZone = "Europe/Istanbul") {
  const localStart = localCalendarDate(date, timeZone);
  const firstDay = Number.isInteger(weekStartsOn) && weekStartsOn >= 0 && weekStartsOn <= 6 ? weekStartsOn : 1;
  localStart.setUTCDate(localStart.getUTCDate() - (localStart.getUTCDay() - firstDay + 7) % 7);
  const localEnd = new Date(localStart);
  localEnd.setUTCDate(localEnd.getUTCDate() + 7);
  return { weekStart: calendarMidnight(localStart, timeZone), weekEnd: calendarMidnight(localEnd, timeZone) };
}

/**
 * Reads all learning metrics for one owner. Every relation is filtered through
 * the related area/course owner, so a dashboard never exposes another owner's records.
 */
export async function getLearningDashboardData(ownerId: string, now = new Date(), weekStartsOn = 1, timeZone = "Europe/Istanbul"): Promise<LearningDashboardData> {
  const { weekStart, weekEnd } = getLearningWeekBounds(now, weekStartsOn, timeZone);
  const [activeAreas, activeCourses, areaStudyMinutes, courseStudyMinutes, upcomingGoals] = await Promise.all([
    db.learningArea.findMany({
      where: { ownerId, status: "IN_PROGRESS" },
      select: { id: true, name: true, category: true, progress: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 8,
    }),
    db.course.findMany({
      where: { ownerId, status: "IN_PROGRESS" },
      select: { id: true, name: true, category: true, progress: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 8,
    }),
    db.learningStudySession.aggregate({
      where: { ownerId, area: { ownerId }, startedAt: { gte: weekStart, lt: weekEnd } },
      _sum: { minutes: true },
    }),
    db.studySession.aggregate({
      where: { course: { ownerId }, startedAt: { gte: weekStart, lt: weekEnd } },
      _sum: { minutes: true },
    }),
    db.goal.findMany({
      where: {
        ownerId,
        completedAt: null,
        dueDate: { gte: calendarMidnight(localCalendarDate(now, timeZone), timeZone) },
        OR: [{ courseId: { not: null }, course: { ownerId } }, { learningAreaId: { not: null }, learningArea: { ownerId } }],
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        course: { select: { id: true, name: true } },
        learningArea: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
  ]);

  const activeLearning = [...activeAreas, ...activeCourses]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    activeLearning,
    weeklyStudyMinutes: (areaStudyMinutes._sum.minutes ?? 0) + (courseStudyMinutes._sum.minutes ?? 0),
    upcomingGoals: upcomingGoals
      .filter((goal): goal is typeof goal & { dueDate: Date } => goal.dueDate !== null)
      .map((goal) => ({ id: goal.id, title: goal.title, dueDate: goal.dueDate, course: goal.course ?? goal.learningArea })),
    weekStart,
    weekEnd,
  };
}

export function formatStudyDuration(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (!hours) return `${remainder} dk`;
  if (!remainder) return `${hours} sa`;
  return `${hours} sa ${remainder} dk`;
}
