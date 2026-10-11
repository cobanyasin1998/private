import { describe, expect, it } from "vitest";
import { englishEntryInputSchema, learningAreaInputSchema, learningItemInputSchema, learningStudySessionInputSchema, learningTodoInputSchema, travelPlaceInputSchema } from "./schemas";

describe("learning area schemas", () => {
  it("accepts a complete Turkish learning area and normalizes optional values", () => {
    const result = learningAreaInputSchema.parse({ name: "Python", group: "TECHNOLOGY", description: "  Temeller  ", progress: "25", resourceUrls: ["https://docs.python.org/3/"] });
    expect(result.description).toBe("Temeller");
    expect(result.progress).toBe(25);
    expect(result.resourceUrls).toHaveLength(1);
  });

  it("requires completed areas to have 100 percent progress", () => {
    expect(learningAreaInputSchema.safeParse({ name: "Tarih", group: "ACADEMIC", status: "COMPLETED", progress: 80 }).success).toBe(false);
  });

  it("rejects non-http resource links", () => {
    expect(learningAreaInputSchema.safeParse({ name: "Bash", group: "TECHNOLOGY", resourceUrls: ["javascript:alert(1)"] }).success).toBe(false);
  });
});

describe("learning item and travel schemas", () => {
  it("supports authorized lab item types with a validated area", () => {
    const result = learningItemInputSchema.parse({ areaId: "cmj2q4s5p0000abcde1234567", title: "Yerel laboratuvar", type: "LAB" });
    expect(result.type).toBe("LAB");
    expect(learningItemInputSchema.parse({ areaId: "cmj2q4s5p0000abcde1234567", parentId: "", title: "Ana konu" }).parentId).toBeNull();
  });

  it("supports nested subtopics and scoped actionable todos", () => {
    const item = learningItemInputSchema.parse({ areaId: "cmj2q4s5p0000abcde1234567", parentId: "cmj2q4s5p0000abcde1234568", title: "Alt konu", type: "TOPIC" });
    expect(item.parentId).toBe("cmj2q4s5p0000abcde1234568");
    const todo = learningTodoInputSchema.parse({ areaId: "cmj2q4s5p0000abcde1234567", itemId: "cmj2q4s5p0000abcde1234568", title: "Yerel laboratuvarı hazırla", priority: "HIGH", dueDate: "2026-02-01T10:00:00Z" });
    expect(todo.status).toBe("TODO");
  });

  it("rejects a study session ending before it starts", () => {
    expect(learningStudySessionInputSchema.safeParse({ areaId: "cmj2q4s5p0000abcde1234567", startedAt: "2026-01-02T10:00:00Z", endedAt: "2026-01-02T09:00:00Z" }).success).toBe(false);
  });

  it("keeps travel planning separate from learning statuses", () => {
    const result = travelPlaceInputSchema.parse({ placeName: "Kapadokya", city: "Nevşehir", country: "Türkiye", estimatedBudget: "12500", status: "WISHLIST" });
    expect(result.estimatedBudget).toBe("12500");
    expect(result.status).toBe("WISHLIST");
  });

  it("supports all English practice types", () => {
    const result = englishEntryInputSchema.parse({ areaId: "cmj2q4s5p0000abcde1234567", type: "LISTENING", title: "Kısa dinleme" });
    expect(result.type).toBe("LISTENING");
  });
});
