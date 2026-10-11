import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { BackupPayload } from "@/lib/backup/schema";
import { verifyBackupAttachments } from "@/lib/backup/attachments";

const asDate = (value: string | null) => value === null ? null : new Date(value);
const jsonInput = (value: unknown) => value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue;

/**
 * Replaces the current owner's personal records in one transaction. The Owner
 * row, password and active sessions are deliberately preserved.
 */
export async function restoreBackup(ownerId: string, payload: BackupPayload) {
  // Repeat the file check at restore time: a successful earlier preview is not
  // proof that the separately backed-up attachment files are still available.
  await verifyBackupAttachments(payload.data.attachments);
  return db.$transaction(async (tx) => {
    const d = payload.data;
    const learningAreas = d.learningAreas ?? [];
    const travelPlaces = d.travelPlaces ?? [];

    await tx.financialTransaction.deleteMany({ where: { ownerId } });
    await tx.budget.deleteMany({ where: { ownerId } });
    await tx.financialCategory.deleteMany({ where: { ownerId } });
    await tx.financialAccount.deleteMany({ where: { ownerId } });
    await tx.task.deleteMany({ where: { ownerId } });
    await tx.project.deleteMany({ where: { ownerId } });
    await tx.movie.deleteMany({ where: { ownerId } });
    await tx.tVSeries.deleteMany({ where: { ownerId } });
    await tx.book.deleteMany({ where: { ownerId } });
    await tx.course.deleteMany({ where: { ownerId } });
    await tx.learningArea.deleteMany({ where: { ownerId } });
    await tx.travelPlace.deleteMany({ where: { ownerId } });
    await tx.note.deleteMany({ where: { ownerId } });
    await tx.habit.deleteMany({ where: { ownerId } });
    await tx.goal.deleteMany({ where: { ownerId } });
    await tx.subscription.deleteMany({ where: { ownerId } });
    await tx.attachment.deleteMany({ where: { ownerId } });
    await tx.tag.deleteMany({ where: { ownerId } });
    await tx.appSetting.deleteMany({ where: { ownerId } });
    await tx.modulePreference.deleteMany({ where: { ownerId } });
    await tx.activityEvent.deleteMany({ where: { ownerId } });

    await tx.owner.update({
      where: { id: ownerId },
      data: {
        displayName: payload.owner.displayName,
        timezone: payload.owner.timezone,
        locale: payload.owner.locale,
        currency: payload.owner.currency,
        weekStartsOn: payload.owner.weekStartsOn,
      },
    });

    await tx.appSetting.createMany({ data: d.settings.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, value: jsonInput(item.value), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.modulePreference.createMany({ data: d.modulePrefs.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.tag.createMany({ data: d.tags.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.attachment.createMany({ data: d.attachments.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt) })) });

    await tx.movie.createMany({ data: d.movies.map(({ ownerId: _sourceOwner, tags: _tags, ...item }) => ({ ...item, ownerId, rating: item.rating === null ? null : item.rating, watchedAt: asDate(item.watchedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const movieTags = d.movies.flatMap((item) => item.tags.map(({ movieId: _movieId, ...relation }) => ({ ...relation, movieId: item.id })));
    if (movieTags.length) await tx.movieTag.createMany({ data: movieTags });

    await tx.tVSeries.createMany({ data: d.series.map(({ ownerId: _sourceOwner, seasons: _seasons, watchEntries: _entries, ...item }) => ({ ...item, ownerId, rating: item.rating === null ? null : item.rating, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const seasons = d.series.flatMap((item) => item.seasons.map(({ episodes: _episodes, ...season }) => ({ ...season, createdAt: new Date(season.createdAt) })));
    if (seasons.length) await tx.tVSeason.createMany({ data: seasons });
    const episodes = d.series.flatMap((item) => item.seasons.flatMap((season) => season.episodes.map((episode) => ({ ...episode, watchedAt: asDate(episode.watchedAt), createdAt: new Date(episode.createdAt) }))));
    if (episodes.length) await tx.tVEpisode.createMany({ data: episodes });
    const watchEntries = d.series.flatMap((item) => item.watchEntries.map((entry) => ({ ...entry, watchedAt: new Date(entry.watchedAt) })));
    if (watchEntries.length) await tx.watchEntry.createMany({ data: watchEntries });

    await tx.book.createMany({ data: d.books.map(({ ownerId: _sourceOwner, sessions: _sessions, tags: _tags, ...item }) => ({ ...item, ownerId, rating: item.rating === null ? null : item.rating, startedAt: asDate(item.startedAt), completedAt: asDate(item.completedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const readingSessions = d.books.flatMap((item) => item.sessions.map((session) => ({ ...session, startedAt: new Date(session.startedAt), endedAt: asDate(session.endedAt) })));
    if (readingSessions.length) await tx.readingSession.createMany({ data: readingSessions });
    const bookTags = d.books.flatMap((item) => item.tags.map(({ bookId: _bookId, ...relation }) => ({ ...relation, bookId: item.id })));
    if (bookTags.length) await tx.bookTag.createMany({ data: bookTags });

    await tx.financialAccount.createMany({ data: d.accounts.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.financialCategory.createMany({ data: d.categories.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.financialTransaction.createMany({ data: d.transactions.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, occurredAt: new Date(item.occurredAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.budget.createMany({ data: d.budgets.map(({ ownerId: _sourceOwner, allocations: _allocations, ...item }) => ({ ...item, ownerId, month: new Date(item.month), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const allocations = d.budgets.flatMap((item) => item.allocations);
    if (allocations.length) await tx.budgetAllocation.createMany({ data: allocations });

    await tx.course.createMany({ data: d.courses.map(({ ownerId: _sourceOwner, lessons: _lessons, sessions: _sessions, tags: _tags, ...item }) => ({ ...item, ownerId, startedAt: asDate(item.startedAt), completedAt: asDate(item.completedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const lessons = d.courses.flatMap((item) => item.lessons.map((lesson) => ({ ...lesson, completedAt: asDate(lesson.completedAt) })));
    if (lessons.length) await tx.courseLesson.createMany({ data: lessons });
    const studySessions = d.courses.flatMap((item) => item.sessions.map((session) => ({ ...session, startedAt: new Date(session.startedAt), endedAt: asDate(session.endedAt) })));
    if (studySessions.length) await tx.studySession.createMany({ data: studySessions });
    const courseTags = d.courses.flatMap((item) => item.tags.map(({ courseId: _courseId, ...relation }) => ({ ...relation, courseId: item.id })));
    if (courseTags.length) await tx.courseTag.createMany({ data: courseTags });

    await tx.learningArea.createMany({ data: learningAreas.map(({ ownerId: _sourceOwner, items: _items, todos: _todos, sessions: _sessions, tags: _tags, englishSkills: _skills, englishEntries: _entries, ...item }) => ({ ...item, ownerId, lastWorkedAt: asDate(item.lastWorkedAt), completedAt: asDate(item.completedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const learningItems = learningAreas.flatMap((area) => area.items.map(({ ownerId: _sourceOwner, tags: _tags, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt), completedAt: asDate(item.completedAt) })));
    if (learningItems.length) await tx.learningItem.createMany({ data: learningItems });
    const learningItemTags = learningAreas.flatMap((area) => area.items.flatMap((item) => item.tags.map(({ itemId: _itemId, ...relation }) => ({ ...relation, itemId: item.id }))));
    if (learningItemTags.length) await tx.learningItemTag.createMany({ data: learningItemTags });
    const learningTodos = learningAreas.flatMap((area) => area.todos.map(({ ownerId: _sourceOwner, ...todo }) => ({ ...todo, ownerId, dueDate: asDate(todo.dueDate), completedAt: asDate(todo.completedAt), createdAt: new Date(todo.createdAt), updatedAt: new Date(todo.updatedAt) })));
    if (learningTodos.length) await tx.learningTodo.createMany({ data: learningTodos });
    const learningAreaTags = learningAreas.flatMap((area) => area.tags.map(({ areaId: _areaId, ...relation }) => ({ ...relation, areaId: area.id })));
    if (learningAreaTags.length) await tx.learningAreaTag.createMany({ data: learningAreaTags });
    const learningSessions = learningAreas.flatMap((area) => area.sessions.map(({ ownerId: _sourceOwner, ...session }) => ({ ...session, ownerId, startedAt: new Date(session.startedAt), endedAt: asDate(session.endedAt) })));
    if (learningSessions.length) await tx.learningStudySession.createMany({ data: learningSessions });
    const englishSkills = learningAreas.flatMap((area) => area.englishSkills.map(({ ownerId: _sourceOwner, ...skill }) => ({ ...skill, ownerId, assessedAt: asDate(skill.assessedAt), createdAt: new Date(skill.createdAt), updatedAt: new Date(skill.updatedAt) })));
    if (englishSkills.length) await tx.englishSkillProgress.createMany({ data: englishSkills });
    const englishEntries = learningAreas.flatMap((area) => area.englishEntries.map(({ ownerId: _sourceOwner, ...entry }) => ({ ...entry, ownerId, completedAt: asDate(entry.completedAt), createdAt: new Date(entry.createdAt), updatedAt: new Date(entry.updatedAt) })));
    if (englishEntries.length) await tx.learningEnglishEntry.createMany({ data: englishEntries });

    await tx.travelPlace.createMany({ data: travelPlaces.map(({ ownerId: _sourceOwner, tags: _tags, ...item }) => ({ ...item, ownerId, estimatedBudget: item.estimatedBudget === null ? null : item.estimatedBudget, visitedAt: asDate(item.visitedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const travelPlaceTags = travelPlaces.flatMap((place) => place.tags.map(({ placeId: _placeId, ...relation }) => ({ ...relation, placeId: place.id })));
    if (travelPlaceTags.length) await tx.travelPlaceTag.createMany({ data: travelPlaceTags });

    await tx.project.createMany({ data: d.projects.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, dueDate: asDate(item.dueDate), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.task.createMany({ data: d.tasks.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, dueDate: asDate(item.dueDate), completedAt: asDate(item.completedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.note.createMany({ data: d.notes.map(({ ownerId: _sourceOwner, tags: _tags, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const noteTags = d.notes.flatMap((item) => item.tags.map(({ noteId: _noteId, ...relation }) => ({ ...relation, noteId: item.id })));
    if (noteTags.length) await tx.noteTag.createMany({ data: noteTags });

    await tx.habit.createMany({ data: d.habits.map(({ ownerId: _sourceOwner, entries: _entries, ...item }) => ({ ...item, ownerId, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const habitEntries = d.habits.flatMap((item) => item.entries.map((entry) => ({ ...entry, date: new Date(entry.date) })));
    if (habitEntries.length) await tx.habitEntry.createMany({ data: habitEntries });
    await tx.goal.createMany({ data: d.goals.map(({ ownerId: _sourceOwner, milestones: _milestones, ...item }) => ({ ...item, ownerId, targetValue: item.targetValue === null ? null : item.targetValue, currentValue: item.currentValue === null ? null : item.currentValue, dueDate: asDate(item.dueDate), completedAt: asDate(item.completedAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    const milestones = d.goals.flatMap((item) => item.milestones.map((milestone) => ({ ...milestone, completedAt: asDate(milestone.completedAt) })));
    if (milestones.length) await tx.goalMilestone.createMany({ data: milestones });
    await tx.subscription.createMany({ data: d.subscriptions.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, amount: item.amount, nextRenewalAt: new Date(item.nextRenewalAt), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })) });
    await tx.activityEvent.createMany({ data: d.activityEvents.map(({ ownerId: _sourceOwner, ...item }) => ({ ...item, ownerId, metadata: item.metadata === null ? Prisma.JsonNull : jsonInput(item.metadata), createdAt: new Date(item.createdAt) })) });

    return { importedAt: new Date().toISOString(), counts: { ...Object.fromEntries(Object.entries(d).map(([key, value]) => [key, value.length])) } };
  });
}
