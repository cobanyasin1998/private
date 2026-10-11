import { describe, expect, it } from "vitest";
import { tagAssignmentSchema, tagInputSchema, tagIdsInputSchema } from "./schemas";

describe("tag schemas", () => {
  it("normalizes names, colors and duplicate ids", () => {
    expect(tagInputSchema.parse({ name: "  iş  ", color: "#abc123" })).toEqual({ name: "iş", color: "#abc123" });
    expect(tagIdsInputSchema.parse('["clx000000000000000000000001","clx000000000000000000000001"]')).toEqual(["clx000000000000000000000001"]);
  });

  it("accepts a valid assignment payload", () => {
    expect(tagAssignmentSchema.parse({ entityType: "movie", entityId: "clx000000000000000000000001", tagIds: [] }).entityType).toBe("movie");
  });

  it("rejects unsafe colors and unsupported entity types", () => {
    expect(tagInputSchema.safeParse({ name: "x", color: "red" }).success).toBe(false);
    expect(tagAssignmentSchema.safeParse({ entityType: "account", entityId: "clx000000000000000000000001", tagIds: [] }).success).toBe(false);
  });
});

