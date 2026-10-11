import { db } from "@/lib/db";

export type ActivityInput = {
  type: string;
  title: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/** Records a small, non-sensitive owner-scoped event without affecting the primary mutation. */
export async function recordActivity(ownerId: string, event: ActivityInput) {
  try {
    await db.activityEvent.create({ data: { ownerId, ...event } });
  } catch {
    // Activity is auxiliary telemetry; a failed event must not undo user data.
  }
}

export async function getRecentActivity(ownerId: string, take = 8) {
  return db.activityEvent.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, type: true, title: true, entityType: true, entityId: true, createdAt: true },
  });
}
