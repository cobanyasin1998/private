import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOwner } from "@/lib/auth/session";

function jsonSafe<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item)) as T; }

export async function GET() {
  const owner = await getSessionOwner();
  if (!owner) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const ownerId = owner.id;
  const [settings, modulePrefs, tags, attachments, movies, series, books, accounts, categories, transactions, budgets, courses, learningAreas, travelPlaces, projects, tasks, notes, habits, goals, subscriptions, activityEvents] = await Promise.all([
    db.appSetting.findMany({ where: { ownerId } }), db.modulePreference.findMany({ where: { ownerId } }), db.tag.findMany({ where: { ownerId } }), db.attachment.findMany({ where: { ownerId } }), db.movie.findMany({ where: { ownerId }, include: { tags: true } }), db.tVSeries.findMany({ where: { ownerId }, include: { seasons: { include: { episodes: true } }, watchEntries: true } }), db.book.findMany({ where: { ownerId }, include: { tags: true, sessions: true } }), db.financialAccount.findMany({ where: { ownerId } }), db.financialCategory.findMany({ where: { ownerId } }), db.financialTransaction.findMany({ where: { ownerId } }), db.budget.findMany({ where: { ownerId }, include: { allocations: true } }), db.course.findMany({ where: { ownerId }, include: { lessons: true, sessions: true, tags: true } }), db.learningArea.findMany({ where: { ownerId }, include: { items: { include: { tags: true } }, todos: true, sessions: true, tags: true, englishSkills: true, englishEntries: true } }), db.travelPlace.findMany({ where: { ownerId }, include: { tags: true } }), db.project.findMany({ where: { ownerId } }), db.task.findMany({ where: { ownerId } }), db.note.findMany({ where: { ownerId }, include: { tags: true } }), db.habit.findMany({ where: { ownerId }, include: { entries: true } }), db.goal.findMany({ where: { ownerId }, include: { milestones: true } }), db.subscription.findMany({ where: { ownerId } }), db.activityEvent.findMany({ where: { ownerId } }),
  ]);
  const payload = jsonSafe({ schemaVersion: 1, exportedAt: new Date().toISOString(), owner: { id: owner.id, email: owner.email, displayName: owner.displayName, timezone: owner.timezone, locale: "tr", currency: owner.currency, weekStartsOn: owner.weekStartsOn }, data: { settings, modulePrefs, tags, attachments, movies, series, books, accounts, categories, transactions, budgets, courses, learningAreas, travelPlaces, projects, tasks, notes, habits, goals, subscriptions, activityEvents } });
  return new NextResponse(JSON.stringify(payload), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="personal-os-backup-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "private, no-store" } });
}
