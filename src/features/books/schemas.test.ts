import { describe, expect, it } from "vitest";
import { bookInputSchema, bookProgressInputSchema, readingSessionInputSchema } from "./schemas";

describe("book schemas", () => {
  it("normalizes book form values and validates progress", () => {
    const result = bookInputSchema.safeParse({ title: "  Dune ", author: "Frank Herbert", pageCount: "500", currentPage: "120", rating: "8.5", status: "READING", coverUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ title: "Dune", pageCount: 500, currentPage: 120, rating: 8.5, status: "READING" });
    expect(bookInputSchema.safeParse({ title: "Dune", pageCount: "10", currentPage: "11" }).success).toBe(false);
  });

  it("rejects unsafe URLs and malformed action inputs", () => {
    expect(bookInputSchema.safeParse({ title: "A", coverUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(bookProgressInputSchema.safeParse({ id: "not-a-cuid", currentPage: 2 }).success).toBe(false);
    expect(readingSessionInputSchema.safeParse({ bookId: "not-a-cuid", pagesRead: 2 }).success).toBe(false);
  });
});
