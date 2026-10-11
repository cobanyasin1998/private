import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatStudyDuration, getLearningDashboardData, getLearningWeekBounds } from "./learning";

const queries = vi.hoisted(() => ({
  areas: vi.fn(), courses: vi.fn(), areaSessions: vi.fn(), courseSessions: vi.fn(), goals: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: {
  learningArea: { findMany: queries.areas }, course: { findMany: queries.courses },
  learningStudySession: { aggregate: queries.areaSessions }, studySession: { aggregate: queries.courseSessions },
  goal: { findMany: queries.goals },
} }));

beforeEach(() => {
  vi.resetAllMocks();
  queries.areas.mockResolvedValue([]);
  queries.courses.mockResolvedValue([]);
  queries.areaSessions.mockResolvedValue({ _sum: { minutes: null } });
  queries.courseSessions.mockResolvedValue({ _sum: { minutes: null } });
  queries.goals.mockResolvedValue([]);
});

describe("dashboard learning metrics", () => {
  it("uses a Monday based half-open week by default", () => {
    const now = new Date("2026-10-14T15:20:00+03:00");
    const { weekStart, weekEnd } = getLearningWeekBounds(now);
    expect(weekStart.toISOString()).toBe("2026-10-11T21:00:00.000Z");
    expect(weekEnd.toISOString()).toBe("2026-10-18T21:00:00.000Z");
    expect(weekEnd.getTime() - weekStart.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("supports Sunday week starts when the owner preference requires it", () => {
    const now = new Date("2026-10-14T15:20:00+03:00");
    expect(getLearningWeekBounds(now, 0).weekStart.toISOString()).toBe("2026-10-10T21:00:00.000Z");
  });

  it("respects owner-local boundaries when the server date is still Sunday", () => {
    const bounds = getLearningWeekBounds(new Date("2026-10-11T22:00:00Z"));
    expect(bounds.weekStart.toISOString()).toBe("2026-10-11T21:00:00.000Z");
  });

  it("computes an exclusive next-week boundary across daylight savings", () => {
    const bounds = getLearningWeekBounds(new Date("2026-03-07T20:00:00Z"), 1, "America/New_York");
    expect(bounds.weekStart.toISOString()).toBe("2026-03-02T05:00:00.000Z");
    expect(bounds.weekEnd.toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });

  it("scopes new and legacy learning reads to the signed-in owner", async () => {
    await getLearningDashboardData("owner-a", new Date("2026-10-14T15:20:00+03:00"));
    expect(queries.areas).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "owner-a", status: "IN_PROGRESS" } }));
    expect(queries.courses).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "owner-a", status: "IN_PROGRESS" } }));
    expect(queries.areaSessions).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ ownerId: "owner-a", area: { ownerId: "owner-a" } }) }));
    expect(queries.courseSessions).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ course: { ownerId: "owner-a" } }) }));
    expect(queries.goals).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      ownerId: "owner-a", completedAt: null,
      OR: [{ courseId: { not: null }, course: { ownerId: "owner-a" } }, { learningAreaId: { not: null }, learningArea: { ownerId: "owner-a" } }],
    }) }));
  });

  it("combines legacy course data and new learning areas without losing recorded time", async () => {
    queries.areas.mockResolvedValue([{ id: "area", name: "Python", category: "Teknoloji", progress: 40, updatedAt: new Date("2026-10-14") }]);
    queries.courses.mockResolvedValue([{ id: "course", name: "Kurs", category: null, progress: 20, updatedAt: new Date("2026-10-13") }]);
    queries.areaSessions.mockResolvedValue({ _sum: { minutes: 90 } });
    queries.courseSessions.mockResolvedValue({ _sum: { minutes: 45 } });
    queries.goals.mockResolvedValue([
      { id: "goal", title: "Bir uygulama bitir", dueDate: new Date("2026-10-20"), course: null, learningArea: { id: "area", name: "Python" } },
      { id: "legacy-goal", title: "Kursu bitir", dueDate: new Date("2026-10-21"), course: { id: "course", name: "Kurs" }, learningArea: null },
    ]);
    const data = await getLearningDashboardData("owner-a", new Date("2026-10-14"));
    expect(data.activeLearning.map((item) => item.id)).toEqual(["area", "course"]);
    expect(data.weeklyStudyMinutes).toBe(135);
    expect(data.upcomingGoals.map((goal) => goal.course?.name)).toEqual(["Python", "Kurs"]);
  });

  it("formats study durations in Turkish-friendly compact units", () => {
    expect(formatStudyDuration(0)).toBe("0 dk");
    expect(formatStudyDuration(45)).toBe("45 dk");
    expect(formatStudyDuration(60)).toBe("1 sa");
    expect(formatStudyDuration(135)).toBe("2 sa 15 dk");
  });
});
