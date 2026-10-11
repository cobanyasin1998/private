import type { Prisma, PrismaClient } from "@prisma/client";
import type { TagEntityType } from "./types";

type DbLike = PrismaClient | Prisma.TransactionClient;

const relationFor: Record<TagEntityType, { entity: "movie" | "book" | "course" | "note"; relation: "movieTag" | "bookTag" | "courseTag" | "noteTag" }> = {
  movie: { entity: "movie", relation: "movieTag" },
  book: { entity: "book", relation: "bookTag" },
  course: { entity: "course", relation: "courseTag" },
  note: { entity: "note", relation: "noteTag" },
};

/** Replace an entity's tags after the caller has verified ownership. */
export async function replaceEntityTags(db: DbLike, entityType: TagEntityType, entityId: string, tagIds: string[]) {
  const config = relationFor[entityType];
  const whereKey = `${config.entity}Id` as const;
  const relation = db[config.relation] as unknown as {
    deleteMany(args: { where: Record<string, string> }): Promise<unknown>;
    createMany(args: { data: Array<Record<string, string>>; skipDuplicates?: boolean }): Promise<unknown>;
  };
  await relation.deleteMany({ where: { [whereKey]: entityId } });
  if (tagIds.length) await relation.createMany({ data: tagIds.map((tagId) => ({ [whereKey]: entityId, tagId })), skipDuplicates: true });
}

