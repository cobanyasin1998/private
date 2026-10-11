export const tagEntityTypes = ["movie", "book", "course", "note"] as const;
export type TagEntityType = (typeof tagEntityTypes)[number];

export type TagItem = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  usageCount: number;
};

