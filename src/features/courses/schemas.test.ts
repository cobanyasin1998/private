import { describe, expect, it } from "vitest";
import { courseGoalInputSchema, courseInputSchema, courseLessonInputSchema, courseNoteInputSchema, studySessionInputSchema } from "./schemas";

describe("courseInputSchema", () => {
  it("coerces form values and defaults progress", () => {
    const parsed = courseInputSchema.parse({ name: "TypeScript", progress: "35", status: "IN_PROGRESS" });
    expect(parsed).toMatchObject({ name: "TypeScript", progress: 35, status: "IN_PROGRESS" });
  });
  it("requires completed courses to be at 100 percent", () => {
    const result = courseInputSchema.safeParse({ name: "Kurs", status: "COMPLETED", progress: "80" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.progress).toContain("Tamamlanan kursun ilerlemesi %100 olmalı.");
  });
  it("rejects unsafe external URLs", () => {
    const result = courseInputSchema.safeParse({ name: "Kurs", externalUrl: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });
});

describe("course lesson and study session schemas", () => {
  it("allows lessons to omit position for server assignment", () => {
    const parsed = courseLessonInputSchema.parse({ courseId: "cmj2q4s5p0000abcde1234567", title: "Giriş" });
    expect(parsed.position).toBeUndefined();
  });
  it("rejects sessions whose end precedes start", () => {
    const result = studySessionInputSchema.safeParse({ courseId: "cmj2q4s5p0000abcde1234567", startedAt: "2026-01-02T10:00:00Z", endedAt: "2026-01-02T09:00:00Z", minutes: 30 });
    expect(result.success).toBe(false);
  });
});

describe("course learning note and goal schemas", () => {
  it("requires meaningful note content and accepts a lesson reference", () => {
    const parsed = courseNoteInputSchema.parse({ courseId: "cmj2q4s5p0000abcde1234567", lessonId: "cmj2q4s5p0000abcde1234568", title: "HTTP notları", content: "Durum kodlarını tekrar et." });
    expect(parsed.lessonId).toBe("cmj2q4s5p0000abcde1234568");
    expect(courseNoteInputSchema.safeParse({ courseId: "cmj2q4s5p0000abcde1234567", title: "Boş", content: "" }).success).toBe(false);
  });

  it("coerces a goal due date and trims optional text", () => {
    const parsed = courseGoalInputSchema.parse({ courseId: "cmj2q4s5p0000abcde1234567", title: "Küçük bir API yayınla", description: "  İlk sürüm  ", dueDate: "2026-02-01" });
    expect(parsed.description).toBe("İlk sürüm");
    expect(parsed.dueDate).toBeInstanceOf(Date);
  });
});
