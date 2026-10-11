/**
 * Contracts for optional metadata providers.
 *
 * Providers are deliberately adapters only: they return normalized metadata
 * and never write to the database. Feature actions decide which fields to
 * persist after validating the user input. This keeps API keys and network
 * calls on the server and lets manual entry remain the default.
 */

export type MetadataKind = "movie" | "series" | "book";

export type MetadataSearchInput = {
  query: string;
  year?: number;
  limit?: number;
};

export type MediaMetadata = {
  kind: "movie" | "series";
  externalId: string;
  title: string;
  overview: string | null;
  releaseYear: number | null;
  posterUrl: string | null;
  genres: string[];
};

export type BookMetadata = {
  kind: "book";
  externalId: string;
  title: string;
  author: string | null;
  isbn: string | null;
  description: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  publisher: string | null;
  publicationYear: number | null;
  genres: string[];
};

export type MetadataRecord = MediaMetadata | BookMetadata;

export type MetadataProvider<K extends MetadataKind, T extends MetadataRecord> = {
  readonly id: string;
  readonly kind: K;
  search(input: MetadataSearchInput): Promise<readonly T[]>;
  getById(externalId: string): Promise<T | null>;
};

export type MovieMetadataProvider = MetadataProvider<"movie", Extract<MetadataRecord, { kind: "movie" }>>;
export type SeriesMetadataProvider = MetadataProvider<"series", Extract<MetadataRecord, { kind: "series" }>>;
export type BookMetadataProvider = MetadataProvider<"book", Extract<MetadataRecord, { kind: "book" }>>;

/**
 * Manual entry is the safe default until an external provider is configured.
 * It intentionally returns no records instead of inventing metadata.
 */
export function createManualMetadataProvider<K extends MetadataKind, T extends MetadataRecord>(kind: K, id = "manual"): MetadataProvider<K, T> {
  return {
    id,
    kind,
    async search() {
      return [];
    },
    async getById() {
      return null;
    },
  };
}
