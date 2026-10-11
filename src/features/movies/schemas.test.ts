import { describe, expect, it } from "vitest";
import { movieInputSchema, movieStatusInputSchema } from "./schemas";

describe("movie schemas", () => {
  it("normalizes form values and accepts optional metadata", () => {
    const result = movieInputSchema.safeParse({ title: "  Arrival ", releaseYear: "2016", runtimeMins: "116", rating: "8.5", status: "COMPLETED", posterUrl: "", review: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ title: "Arrival", releaseYear: 2016, runtimeMins: 116, rating: 8.5, status: "COMPLETED" });
  });

  it("rejects unsafe or malformed movie values", () => {
    expect(movieInputSchema.safeParse({ title: "", rating: "10.25" }).success).toBe(false);
    expect(movieInputSchema.safeParse({ title: "A", posterUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(movieStatusInputSchema.safeParse({ id: "not-a-cuid", status: "WATCHING" }).success).toBe(false);
  });
});
