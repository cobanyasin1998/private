import { z } from "zod";
import { attachmentInputSchema, attachmentStorageKeySchema } from "@/lib/attachments/schema";

const id = z.string().trim().min(1).max(128);
const ownerId = id;
const date = z.string().datetime({ offset: true });
const nullableDate = date.nullable();
const decimal = z.union([z.string().regex(/^-?\d+(\.\d+)?$/), z.number().finite()]);
const nullableDecimal = decimal.nullable();
const optionalString = z.string().nullable();
const jsonValue: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string(), z.number().finite(), z.boolean(), z.null(),
  z.array(jsonValue), z.record(jsonValue),
]));

const movieTag = z.object({ movieId: id, tagId: id }).strict();
const bookTag = z.object({ bookId: id, tagId: id }).strict();
const courseTag = z.object({ courseId: id, tagId: id }).strict();
const noteTag = z.object({ noteId: id, tagId: id }).strict();

const appSetting = z.object({ id, ownerId, key: z.string().min(1).max(200), value: jsonValue, createdAt: date, updatedAt: date }).strict();
const modulePreference = z.object({ id, ownerId, moduleId: z.string().min(1).max(120), enabled: z.boolean(), sortOrder: z.number().int(), view: optionalString, createdAt: date, updatedAt: date }).strict();
const tag = z.object({ id, ownerId, name: z.string().min(1).max(120), color: optionalString, createdAt: date, updatedAt: date }).strict();
const attachment = attachmentInputSchema.extend({ id, ownerId, storageKey: attachmentStorageKeySchema, createdAt: date }).strict();

const movie = z.object({
  id, ownerId, title: z.string().min(1), releaseYear: z.number().int().nullable(), runtimeMins: z.number().int().nonnegative().nullable(),
  posterUrl: optionalString, status: z.enum(["PLANNED", "WATCHING", "COMPLETED", "DROPPED"]), rating: nullableDecimal, review: optionalString,
  watchedAt: nullableDate, rewatchCount: z.number().int().nonnegative(), favorite: z.boolean(), createdAt: date, updatedAt: date,
  tags: z.array(movieTag),
}).strict();

const tvEpisode = z.object({ id, seasonId: id, number: z.number().int().positive(), title: z.string().min(1), watchedAt: nullableDate, createdAt: date }).strict();
const tvSeason = z.object({ id, seriesId: id, number: z.number().int().positive(), title: optionalString, createdAt: date, episodes: z.array(tvEpisode) }).strict();
const watchEntry = z.object({ id, seriesId: id, watchedAt: date, note: optionalString }).strict();
const series = z.object({
  id, ownerId, title: z.string().min(1), releaseYear: z.number().int().nullable(), posterUrl: optionalString,
  status: z.enum(["PLANNED", "WATCHING", "COMPLETED", "DROPPED"]), rating: nullableDecimal, currentEpisode: z.number().int().nonnegative(), favorite: z.boolean(), createdAt: date, updatedAt: date,
  seasons: z.array(tvSeason), watchEntries: z.array(watchEntry),
}).strict();

const readingSession = z.object({ id, bookId: id, startedAt: date, endedAt: nullableDate, pagesRead: z.number().int().nonnegative(), note: optionalString }).strict();
const book = z.object({
  id, ownerId, title: z.string().min(1), author: optionalString, isbn: optionalString, coverUrl: optionalString, pageCount: z.number().int().positive().nullable(), currentPage: z.number().int().nonnegative(),
  genre: optionalString, description: optionalString, publisher: optionalString, publicationYear: z.number().int().nullable(), rating: nullableDecimal, review: optionalString,
  status: z.enum(["WANT_TO_READ", "READING", "COMPLETED", "PAUSED", "DROPPED"]), favorite: z.boolean(), startedAt: nullableDate, completedAt: nullableDate, createdAt: date, updatedAt: date,
  sessions: z.array(readingSession), tags: z.array(bookTag),
}).strict();

const financialAccount = z.object({ id, ownerId, name: z.string().min(1), type: z.enum(["CASH", "BANK", "CREDIT_CARD", "SAVINGS", "OTHER"]), currency: z.string().min(1).max(12), openingBalance: decimal, archived: z.boolean(), createdAt: date, updatedAt: date }).strict();
const financialCategory = z.object({ id, ownerId, name: z.string().min(1), kind: z.enum(["INCOME", "EXPENSE", "TRANSFER"]), color: optionalString, createdAt: date, updatedAt: date }).strict();
const transaction = z.object({ id, ownerId, accountId: id, categoryId: id.nullable(), type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]), amount: decimal, currency: z.string().min(1).max(12), occurredAt: date, description: z.string(), transferGroup: optionalString, recurring: z.boolean(), createdAt: date, updatedAt: date }).strict();
const budgetAllocation = z.object({ id, budgetId: id, categoryId: id, amount: decimal }).strict();
const budget = z.object({ id, ownerId, month: date, name: z.string().min(1), currency: z.string().min(1).max(12), createdAt: date, updatedAt: date, allocations: z.array(budgetAllocation) }).strict();

const courseLesson = z.object({ id, courseId: id, title: z.string().min(1), position: z.number().int().nonnegative(), completedAt: nullableDate, notes: optionalString }).strict();
const studySession = z.object({ id, courseId: id, startedAt: date, endedAt: nullableDate, minutes: z.number().int().nonnegative(), note: optionalString }).strict();
const course = z.object({
  id, ownerId, name: z.string().min(1), category: optionalString, description: optionalString, provider: optionalString, externalUrl: optionalString,
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED", "DROPPED"]), progress: z.number().int().min(0).max(100), startedAt: nullableDate, completedAt: nullableDate, createdAt: date, updatedAt: date,
  lessons: z.array(courseLesson), sessions: z.array(studySession), tags: z.array(courseTag),
}).strict();

const learningAreaTag = z.object({ areaId: id, tagId: id }).strict();
const learningItemTag = z.object({ itemId: id, tagId: id }).strict();
const learningItem = z.object({
  id, ownerId, areaId: id, parentId: id.nullable().optional().default(null), title: z.string().min(1), description: optionalString,
  summary: optionalString.optional(), content: optionalString.optional(), requirements: optionalString.optional(), goals: optionalString.optional(),
  type: z.enum(["TOPIC", "PRACTICE", "LAB", "MINI_PROJECT", "QUIZ", "READING", "VIDEO", "REVIEW"]),
  position: z.number().int().nonnegative(), estimatedMinutes: z.number().int().nonnegative().nullable(), notes: optionalString, externalUrl: optionalString,
  completedAt: nullableDate, createdAt: date, updatedAt: date, tags: z.array(learningItemTag),
}).strict();
const learningTodo = z.object({
  id, ownerId, areaId: id, itemId: id.nullable().optional().default(null), title: z.string().min(1), description: optionalString,
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELED"]), priority: z.enum(["LOW", "MEDIUM", "HIGH"]), dueDate: nullableDate,
  completedAt: nullableDate, createdAt: date, updatedAt: date,
}).strict();
const learningStudySession = z.object({ id, ownerId, areaId: id, startedAt: date, endedAt: nullableDate, minutes: z.number().int().nonnegative(), note: optionalString }).strict();
const englishSkillProgress = z.object({ id, ownerId, areaId: id, skill: z.enum(["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "SPEAKING", "WRITING"]), level: optionalString, progress: z.number().int().min(0).max(100), assessedAt: nullableDate, createdAt: date, updatedAt: date }).strict();
const englishEntry = z.object({ id, ownerId, areaId: id, type: z.enum(["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "SPEAKING", "WRITING"]), title: z.string().min(1), content: optionalString, notes: optionalString, progress: z.number().int().min(0).max(100), completedAt: nullableDate, createdAt: date, updatedAt: date }).strict();
const learningArea = z.object({
  id, ownerId, slug: z.string().min(1), name: z.string().min(1), description: optionalString,
  group: z.enum(["TECHNOLOGY", "ACADEMIC", "PERSONAL_LIFE"]), category: optionalString, subCategory: optionalString,
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]), status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED"]), progress: z.number().int().min(0).max(100),
  estimatedMinutes: z.number().int().nonnegative().nullable(), prerequisites: optionalString, notes: optionalString, resourceUrls: z.array(z.string().max(2000)).default([]),
  lastWorkedAt: nullableDate, completedAt: nullableDate, englishLevel: optionalString, createdAt: date, updatedAt: date,
  items: z.array(learningItem), todos: z.array(learningTodo).default([]), sessions: z.array(learningStudySession), tags: z.array(learningAreaTag), englishSkills: z.array(englishSkillProgress), englishEntries: z.array(englishEntry),
}).strict();

const travelPlaceTag = z.object({ placeId: id, tagId: id }).strict();
const travelPlace = z.object({
  id, ownerId, placeName: z.string().min(1), city: optionalString, country: optionalString,
  status: z.enum(["WISHLIST", "VISITED"]), priority: z.enum(["LOW", "MEDIUM", "HIGH"]), estimatedBudget: nullableDecimal, currency: z.string().min(1).max(12),
  notes: optionalString, photoUrl: optionalString, externalUrl: optionalString, visitedAt: nullableDate, createdAt: date, updatedAt: date, tags: z.array(travelPlaceTag),
}).strict();

const project = z.object({ id, ownerId, name: z.string().min(1), description: optionalString, status: z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]), dueDate: nullableDate, createdAt: date, updatedAt: date }).strict();
const task = z.object({ id, ownerId, projectId: id.nullable(), title: z.string().min(1), description: optionalString, status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELED"]), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]), dueDate: nullableDate, completedAt: nullableDate, createdAt: date, updatedAt: date }).strict();
const note = z.object({ id, ownerId, courseId: id.nullable().optional(), lessonId: id.nullable().optional(), learningAreaId: id.nullable().optional(), learningItemId: id.nullable().optional(), title: z.string().min(1), content: z.string(), category: optionalString, createdAt: date, updatedAt: date, tags: z.array(noteTag) }).strict();
const habitEntry = z.object({ id, habitId: id, date: date, completed: z.boolean(), note: optionalString }).strict();
const habit = z.object({ id, ownerId, name: z.string().min(1), frequency: z.enum(["DAILY", "WEEKLY"]), targetCount: z.number().int().positive(), active: z.boolean(), createdAt: date, updatedAt: date, entries: z.array(habitEntry) }).strict();
const goalMilestone = z.object({ id, goalId: id, title: z.string().min(1), position: z.number().int().nonnegative(), completedAt: nullableDate }).strict();
const goal = z.object({ id, ownerId, courseId: id.nullable().optional(), learningAreaId: id.nullable().optional(), learningItemId: id.nullable().optional(), title: z.string().min(1), description: optionalString, targetValue: nullableDecimal, currentValue: nullableDecimal, dueDate: nullableDate, completedAt: nullableDate, createdAt: date, updatedAt: date, milestones: z.array(goalMilestone) }).strict();
const subscription = z.object({ id, ownerId, name: z.string().min(1), category: optionalString, amount: decimal, currency: z.string().min(1).max(12), interval: z.enum(["MONTHLY", "YEARLY"]), nextRenewalAt: date, active: z.boolean(), createdAt: date, updatedAt: date }).strict();
const activityEvent = z.object({ id, ownerId, type: z.string().min(1), title: z.string().min(1), entityType: optionalString, entityId: optionalString, metadata: jsonValue.nullable(), createdAt: date }).strict();

const data = z.object({
  settings: z.array(appSetting), modulePrefs: z.array(modulePreference), tags: z.array(tag), attachments: z.array(attachment), movies: z.array(movie), series: z.array(series), books: z.array(book),
  accounts: z.array(financialAccount), categories: z.array(financialCategory), transactions: z.array(transaction), budgets: z.array(budget), courses: z.array(course), projects: z.array(project), tasks: z.array(task), notes: z.array(note), habits: z.array(habit), goals: z.array(goal), subscriptions: z.array(subscription), activityEvents: z.array(activityEvent),
  learningAreas: z.array(learningArea).optional(), travelPlaces: z.array(travelPlace).optional(),
}).strict();

export const backupPayloadSchema = z.object({
  schemaVersion: z.literal(1), exportedAt: date,
  owner: z.object({ id, email: z.string().email(), displayName: z.string().min(1), timezone: z.string().min(1), locale: z.literal("tr"), currency: z.string().min(1).max(12), weekStartsOn: z.number().int().min(0).max(6) }).strict(),
  data,
}).strict();

export type BackupPayload = z.infer<typeof backupPayloadSchema>;

function unique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`${label} içinde yinelenen kimlik var.`);
}

function references(payload: BackupPayload) {
  const d = payload.data;
  const learningAreas = d.learningAreas ?? [];
  const travelPlaces = d.travelPlaces ?? [];
  const tags = new Set(d.tags.map((item) => item.id));
  const movies = new Set(d.movies.map((item) => item.id));
  const books = new Set(d.books.map((item) => item.id));
  const courses = new Set(d.courses.map((item) => item.id));
  const lessons = new Set(d.courses.flatMap((item) => item.lessons.map((lesson) => lesson.id)));
  const lessonCourses = new Map(d.courses.flatMap((item) => item.lessons.map((lesson) => [lesson.id, item.id] as const)));
  const notes = new Set(d.notes.map((item) => item.id));
  const series = new Set(d.series.map((item) => item.id));
  const seasons = new Set(d.series.flatMap((item) => item.seasons.map((season) => season.id)));
  const accounts = new Set(d.accounts.map((item) => item.id));
  const categories = new Set(d.categories.map((item) => item.id));
  const budgets = new Set(d.budgets.map((item) => item.id));
  const projects = new Set(d.projects.map((item) => item.id));
  const habits = new Set(d.habits.map((item) => item.id));
  const goals = new Set(d.goals.map((item) => item.id));
  const learningAreaIds = new Set(learningAreas.map((item) => item.id));
  const learningItems = new Map(learningAreas.flatMap((area) => area.items.map((item) => [item.id, area.id] as const)));

  unique(d.settings.map((item) => item.id), "settings"); unique(d.modulePrefs.map((item) => item.id), "modulePrefs"); unique(d.tags.map((item) => item.id), "tags");
  unique(d.attachments.map((item) => item.id), "attachments");
  unique(d.attachments.map((item) => item.storageKey), "attachment storage keys");
  unique(learningAreas.map((item) => item.id), "learningAreas");
  unique(travelPlaces.map((item) => item.id), "travelPlaces");
  unique(d.movies.map((item) => item.id), "movies"); unique(d.series.map((item) => item.id), "series"); unique(d.books.map((item) => item.id), "books"); unique(d.accounts.map((item) => item.id), "accounts"); unique(d.categories.map((item) => item.id), "categories"); unique(d.transactions.map((item) => item.id), "transactions"); unique(d.budgets.map((item) => item.id), "budgets"); unique(d.courses.map((item) => item.id), "courses"); unique(d.projects.map((item) => item.id), "projects"); unique(d.tasks.map((item) => item.id), "tasks"); unique(d.notes.map((item) => item.id), "notes"); unique(d.habits.map((item) => item.id), "habits"); unique(d.goals.map((item) => item.id), "goals"); unique(d.subscriptions.map((item) => item.id), "subscriptions"); unique(d.activityEvents.map((item) => item.id), "activityEvents");

  for (const item of d.movies) for (const relation of item.tags) { if (!movies.has(relation.movieId) || !tags.has(relation.tagId)) throw new Error("Film etiketi geçersiz bir kayda bağlanıyor."); }
  for (const item of d.books) for (const relation of item.tags) { if (!books.has(relation.bookId) || !tags.has(relation.tagId)) throw new Error("Kitap etiketi geçersiz bir kayda bağlanıyor."); }
  for (const item of d.courses) for (const relation of item.tags) { if (!courses.has(relation.courseId) || !tags.has(relation.tagId)) throw new Error("Kurs etiketi geçersiz bir kayda bağlanıyor."); }
  for (const item of d.notes) for (const relation of item.tags) { if (!notes.has(relation.noteId) || !tags.has(relation.tagId)) throw new Error("Not etiketi geçersiz bir kayda bağlanıyor."); }
  for (const item of d.notes) { if (item.courseId !== undefined && item.courseId !== null && !courses.has(item.courseId)) throw new Error("Kurs notu geçersiz bir kursa bağlanıyor."); if (item.lessonId !== undefined && item.lessonId !== null && (!lessons.has(item.lessonId) || (item.courseId !== undefined && item.courseId !== null && lessonCourses.get(item.lessonId) !== item.courseId))) throw new Error("Kurs notu geçersiz bir derse bağlanıyor."); }
  for (const item of d.series) { for (const season of item.seasons) { if (season.seriesId !== item.id || !series.has(season.seriesId)) throw new Error("Dizi sezonu geçersiz bir diziye bağlanıyor."); for (const episode of season.episodes) if (episode.seasonId !== season.id || !seasons.has(episode.seasonId)) throw new Error("Dizi bölümü geçersiz bir sezona bağlanıyor."); } for (const entry of item.watchEntries) if (entry.seriesId !== item.id) throw new Error("Dizi izleme kaydı geçersiz."); }
  for (const item of d.books) for (const session of item.sessions) if (session.bookId !== item.id) throw new Error("Okuma oturumu geçersiz bir kitaba bağlanıyor.");
  for (const item of d.courses) { for (const lesson of item.lessons) if (lesson.courseId !== item.id) throw new Error("Ders geçersiz bir kursa bağlanıyor."); for (const session of item.sessions) if (session.courseId !== item.id) throw new Error("Çalışma oturumu geçersiz bir kursa bağlanıyor."); }
  for (const item of d.transactions) if (!accounts.has(item.accountId) || (item.categoryId !== null && !categories.has(item.categoryId))) throw new Error("Finans işlemi geçersiz bir hesaba veya kategoriye bağlanıyor.");
  for (const item of d.budgets) for (const allocation of item.allocations) if (allocation.budgetId !== item.id || !budgets.has(allocation.budgetId) || !categories.has(allocation.categoryId)) throw new Error("Bütçe dağılımı geçersiz.");
  for (const item of d.tasks) if (item.projectId !== null && !projects.has(item.projectId)) throw new Error("Görev geçersiz bir projeye bağlanıyor.");
  for (const item of d.habits) for (const entry of item.entries) if (entry.habitId !== item.id || !habits.has(entry.habitId)) throw new Error("Alışkanlık kaydı geçersiz.");
  for (const item of d.goals) for (const milestone of item.milestones) if (milestone.goalId !== item.id || !goals.has(milestone.goalId)) throw new Error("Hedef kilometre taşı geçersiz.");
  for (const item of d.goals) if (item.courseId !== undefined && item.courseId !== null && !courses.has(item.courseId)) throw new Error("Öğrenme hedefi geçersiz bir kursa bağlanıyor.");
  for (const item of learningAreas) {
    unique(item.items.map((child) => child.id), "learningItems");
    unique(item.todos.map((todo) => todo.id), "learningTodos");
    unique(item.sessions.map((session) => session.id), "learningStudySessions");
    unique(item.englishSkills.map((skill) => skill.id), "englishSkills");
    unique(item.englishEntries.map((entry) => entry.id), "englishEntries");
    for (const relation of item.tags) if (relation.areaId !== item.id || !tags.has(relation.tagId)) throw new Error("Öğrenme alanı etiketi geçersiz.");
    for (const learningItem of item.items) {
      if (learningItem.areaId !== item.id || learningItem.ownerId !== item.ownerId) throw new Error("Öğrenme konusu geçersiz bir alana bağlanıyor.");
      if (learningItem.parentId !== null && learningItem.parentId !== undefined && (!item.items.some((parent) => parent.id === learningItem.parentId) || learningItem.parentId === learningItem.id)) throw new Error("Öğrenme alt konusu geçersiz bir konuya bağlanıyor.");
      for (const relation of learningItem.tags) if (relation.itemId !== learningItem.id || !tags.has(relation.tagId)) throw new Error("Öğrenme konusu etiketi geçersiz.");
    }
    for (const todo of item.todos) {
      if (todo.areaId !== item.id || todo.ownerId !== item.ownerId || (todo.itemId !== null && todo.itemId !== undefined && !item.items.some((learningItem) => learningItem.id === todo.itemId))) throw new Error("Öğrenme yapılacağı geçersiz bir alana veya konuya bağlanıyor.");
    }
    for (const session of item.sessions) if (session.areaId !== item.id || session.ownerId !== item.ownerId) throw new Error("Öğrenme oturumu geçersiz bir alana bağlanıyor.");
    for (const skill of item.englishSkills) if (skill.areaId !== item.id || skill.ownerId !== item.ownerId) throw new Error("İngilizce becerisi geçersiz bir alana bağlanıyor.");
    for (const entry of item.englishEntries) if (entry.areaId !== item.id || entry.ownerId !== item.ownerId) throw new Error("İngilizce kaydı geçersiz bir alana bağlanıyor.");
  }
  for (const item of d.notes) if (item.learningAreaId !== undefined && item.learningAreaId !== null && !learningAreaIds.has(item.learningAreaId)) throw new Error("Öğrenme notu geçersiz bir alana bağlanıyor.");
  for (const item of d.notes) if (item.learningItemId !== undefined && item.learningItemId !== null && (!learningItems.has(item.learningItemId) || (item.learningAreaId !== undefined && item.learningAreaId !== null && learningItems.get(item.learningItemId) !== item.learningAreaId))) throw new Error("Öğrenme notu geçersiz bir konuya bağlanıyor.");
  for (const item of d.goals) if (item.learningAreaId !== undefined && item.learningAreaId !== null && !learningAreaIds.has(item.learningAreaId)) throw new Error("Öğrenme hedefi geçersiz bir alana bağlanıyor.");
  for (const item of d.goals) if (item.learningItemId !== undefined && item.learningItemId !== null && (!learningItems.has(item.learningItemId) || (item.learningAreaId !== undefined && item.learningAreaId !== null && learningItems.get(item.learningItemId) !== item.learningAreaId))) throw new Error("Öğrenme hedefi geçersiz bir konuya bağlanıyor.");
  for (const item of travelPlaces) for (const relation of item.tags) if (relation.placeId !== item.id || !tags.has(relation.tagId)) throw new Error("Gezilecek yer etiketi geçersiz.");
}

export function parseBackupPayload(input: unknown): BackupPayload {
  const parsed = backupPayloadSchema.parse(input);
  references(parsed);
  return parsed;
}

export function backupSummary(payload: BackupPayload) {
  const data = payload.data;
  return {
    schemaVersion: payload.schemaVersion,
    exportedAt: payload.exportedAt,
    source: { email: payload.owner.email, displayName: payload.owner.displayName },
    counts: {
      settings: data.settings.length, movies: data.movies.length, series: data.series.length, books: data.books.length, accounts: data.accounts.length,
      transactions: data.transactions.length, budgets: data.budgets.length, courses: data.courses.length, projects: data.projects.length, tasks: data.tasks.length,
      notes: data.notes.length, habits: data.habits.length, goals: data.goals.length, subscriptions: data.subscriptions.length, attachments: data.attachments.length,
      learningAreas: data.learningAreas?.length ?? 0, travelPlaces: data.travelPlaces?.length ?? 0,
    },
  };
}
