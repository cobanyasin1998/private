import { describe, expect, it } from "vitest";
import { createManualMetadataProvider, type BookMetadata, type BookMetadataProvider, type MediaMetadata } from "./types";

describe("metadata provider contract", () => {
  it("keeps manual entry deterministic and free of fabricated records", async () => {
    const provider = createManualMetadataProvider<"movie", Extract<MediaMetadata, { kind: "movie" }>>("movie");
    expect(await provider.search({ query: "arrival" })).toEqual([]);
    expect(await provider.getById("movie-1")).toBeNull();
  });

  it("supports a typed book adapter without coupling it to persistence", async () => {
    const record: BookMetadata = {
      kind: "book",
      externalId: "isbn:9780000000000",
      title: "Example",
      author: "Author",
      isbn: "9780000000000",
      description: null,
      coverUrl: null,
      pageCount: 100,
      publisher: null,
      publicationYear: 2026,
      genres: [],
    };
    const provider: BookMetadataProvider = {
      id: "test-books",
      kind: "book" as const,
      async search() { return [record]; },
      async getById(id: string) { return id === record.externalId ? record : null; },
    };
    expect((await provider.search({ query: "example" }))[0].externalId).toBe(record.externalId);
    expect(await provider.getById("missing")).toBeNull();
  });
});
