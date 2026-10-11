import { describe, expect, it } from "vitest";
import { episodeInputSchema, episodeWatchedInputSchema, seasonInputSchema, seriesInputSchema } from "./schemas";

describe("series schemas", () => {
  it("coerces form values for a valid series", () => {
    const parsed = seriesInputSchema.parse({ title: "Severance", releaseYear: "2022", rating: "8.7", status: "WATCHING", favorite: false });
    expect(parsed.releaseYear).toBe(2022);
    expect(parsed.rating).toBe(8.7);
  });

  it("rejects an invalid rating", () => {
    expect(seriesInputSchema.safeParse({ title: "Test", rating: "11" }).success).toBe(false);
  });

  it("requires a valid owner-scoped season and episode input shape", () => {
    expect(seasonInputSchema.safeParse({ seriesId: "not-a-cuid", number: "1" }).success).toBe(false);
    expect(episodeInputSchema.safeParse({ seasonId: "cmj9y0m8x0000qz9n5u1a2b3c", number: "1", title: "Pilot" }).success).toBe(true);
  });

  it("validates watched toggles", () => {
    expect(episodeWatchedInputSchema.safeParse({ id: "cmj9y0m8x0000qz9n5u1a2b3c", watched: true }).success).toBe(true);
    expect(episodeWatchedInputSchema.safeParse({ id: "bad", watched: true }).success).toBe(false);
  });
});
