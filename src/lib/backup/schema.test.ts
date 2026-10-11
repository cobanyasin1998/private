import { describe, expect, it } from "vitest";
import { backupPayloadSchema, parseBackupPayload } from "@/lib/backup/schema";

const payload = {
  schemaVersion: 1 as const,
  exportedAt: "2026-01-01T00:00:00.000Z",
  owner: { id: "owner-1", email: "owner@example.com", displayName: "Owner", timezone: "Europe/Istanbul", locale: "tr" as const, currency: "TRY", weekStartsOn: 1 },
  data: {
    settings: [], modulePrefs: [], tags: [], attachments: [], movies: [], series: [], books: [], accounts: [], categories: [], transactions: [], budgets: [], courses: [], projects: [], tasks: [], notes: [], habits: [], goals: [], subscriptions: [], activityEvents: [],
  },
};

describe("backup payload", () => {
  it("accepts the complete empty export shape", () => {
    expect(parseBackupPayload(payload)).toEqual(payload);
  });

  it("rejects an unsupported schema version and unknown fields", () => {
    expect(backupPayloadSchema.safeParse({ ...payload, schemaVersion: 2 }).success).toBe(false);
    expect(backupPayloadSchema.safeParse({ ...payload, extra: true }).success).toBe(false);
  });

  it("rejects relations that point outside the backup", () => {
    const invalid = {
      ...payload,
      data: {
        ...payload.data,
        movies: [{ id: "movie-1", ownerId: "owner-1", title: "Film", releaseYear: null, runtimeMins: null, posterUrl: null, status: "PLANNED" as const, rating: null, review: null, watchedAt: null, rewatchCount: 0, favorite: false, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [{ movieId: "movie-1", tagId: "missing-tag" }] }],
      },
    };
    expect(() => parseBackupPayload(invalid)).toThrow("etiketi");
  });

  it("validates course learning note references", () => {
    const course = { id: "course-1", ownerId: "owner-1", name: "TypeScript", category: null, description: null, provider: null, externalUrl: null, status: "IN_PROGRESS" as const, progress: 35, startedAt: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, lessons: [{ id: "lesson-1", courseId: "course-1", title: "Giriş", position: 1, completedAt: null, notes: null }], sessions: [], tags: [] };
    const note = { id: "note-1", ownerId: "owner-1", courseId: "course-1", lessonId: "lesson-1", title: "HTTP", content: "Durum kodları", category: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] };
    expect(parseBackupPayload({ ...payload, data: { ...payload.data, courses: [course], notes: [note] } }).data.notes[0].lessonId).toBe("lesson-1");
    expect(() => parseBackupPayload({ ...payload, data: { ...payload.data, courses: [course], notes: [{ ...note, lessonId: "missing-lesson" }] } })).toThrow("Kurs notu");
  });

  it("rejects unsafe attachment keys and unsupported metadata", () => {
    const attachment = { id: "attachment-1", ownerId: "owner-1", storageKey: "owner-1/abc-123", fileName: "note.txt", mimeType: "text/plain", sizeBytes: 5, createdAt: payload.exportedAt };
    const withAttachment = (changes: object) => ({ ...payload, data: { ...payload.data, attachments: [{ ...attachment, ...changes }] } });
    expect(() => parseBackupPayload(withAttachment({ storageKey: "../.env" }))).toThrow();
    expect(() => parseBackupPayload(withAttachment({ mimeType: "text/html" }))).toThrow();
    expect(() => parseBackupPayload(withAttachment({ sizeBytes: 0 }))).toThrow();
    expect(() => parseBackupPayload(withAttachment({ sizeBytes: 10 * 1024 * 1024 + 1 }))).toThrow();
  });

  it("rejects duplicate attachment IDs or shared storage keys", () => {
    const attachment = { id: "attachment-1", ownerId: "owner-1", storageKey: "owner-1/abc-123", fileName: "note.txt", mimeType: "text/plain", sizeBytes: 5, createdAt: payload.exportedAt };
    expect(() => parseBackupPayload({ ...payload, data: { ...payload.data, attachments: [attachment, { ...attachment, storageKey: "owner-1/abc-124" }] } })).toThrow("yinelenen");
    expect(() => parseBackupPayload({ ...payload, data: { ...payload.data, attachments: [attachment, { ...attachment, id: "attachment-2" }] } })).toThrow("yinelenen");
  });

  it("round-trips learning areas, English records and travel places", () => {
    const area = {
      id: "area-1", ownerId: "owner-1", slug: "python", name: "Python", description: null,
      group: "TECHNOLOGY" as const, category: "Programlama", subCategory: null, level: "BEGINNER" as const, status: "IN_PROGRESS" as const, progress: 20,
      estimatedMinutes: 300, prerequisites: null, notes: null, lastWorkedAt: null, completedAt: null, englishLevel: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt,
      items: [{ id: "item-1", ownerId: "owner-1", areaId: "area-1", title: "Değişkenler", description: null, type: "TOPIC" as const, position: 1, estimatedMinutes: 30, notes: null, externalUrl: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] }],
      sessions: [{ id: "study-1", ownerId: "owner-1", areaId: "area-1", startedAt: payload.exportedAt, endedAt: null, minutes: 30, note: null }],
      tags: [], englishSkills: [{ id: "skill-1", ownerId: "owner-1", areaId: "area-1", skill: "READING" as const, level: "A1", progress: 5, assessedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt }],
      englishEntries: [{ id: "entry-1", ownerId: "owner-1", areaId: "area-1", type: "VOCABULARY" as const, title: "Temel kelimeler", content: null, notes: null, progress: 10, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt }],
    };
    const place = { id: "place-1", ownerId: "owner-1", placeName: "Kapadokya", city: "Nevşehir", country: "Türkiye", status: "WISHLIST" as const, priority: "HIGH" as const, estimatedBudget: "5000", currency: "TRY", notes: null, photoUrl: null, externalUrl: null, visitedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] };
    const parsed = parseBackupPayload({ ...payload, data: { ...payload.data, learningAreas: [area], travelPlaces: [place] } });
    expect(parsed.data.learningAreas?.[0].items[0].title).toBe("Değişkenler");
    expect(parsed.data.travelPlaces?.[0].placeName).toBe("Kapadokya");
  });

  it("rejects learning children owned by another source owner", () => {
    const area = {
      id: "area-1", ownerId: "owner-1", slug: "python", name: "Python", description: null, group: "TECHNOLOGY" as const, category: null, subCategory: null, level: "BEGINNER" as const, status: "PLANNED" as const, progress: 0, estimatedMinutes: null, prerequisites: null, notes: null, lastWorkedAt: null, completedAt: null, englishLevel: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt,
      items: [{ id: "item-1", ownerId: "other-owner", areaId: "area-1", title: "Konusu", description: null, type: "TOPIC" as const, position: 0, estimatedMinutes: null, notes: null, externalUrl: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] }], sessions: [], tags: [], englishSkills: [], englishEntries: [],
    };
    expect(() => parseBackupPayload({ ...payload, data: { ...payload.data, learningAreas: [area] } })).toThrow("Öğrenme konusu");
  });

  it("validates nested learning topics and area todos", () => {
    const area = {
      id: "area-detail", ownerId: "owner-1", slug: "python", name: "Python", description: null, group: "TECHNOLOGY" as const, category: null, subCategory: null, level: "BEGINNER" as const, status: "PLANNED" as const, progress: 0, estimatedMinutes: null, prerequisites: null, notes: null, lastWorkedAt: null, completedAt: null, englishLevel: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt,
      items: [
        { id: "item-parent", ownerId: "owner-1", areaId: "area-detail", parentId: null, title: "Fonksiyonlar", description: null, type: "TOPIC" as const, position: 0, estimatedMinutes: null, notes: null, externalUrl: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] },
        { id: "item-child", ownerId: "owner-1", areaId: "area-detail", parentId: "item-parent", title: "Parametreler", description: null, type: "TOPIC" as const, position: 1, estimatedMinutes: null, notes: null, externalUrl: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] },
      ],
      todos: [{ id: "todo-1", ownerId: "owner-1", areaId: "area-detail", itemId: "item-child", title: "Alıştırmaları tamamla", description: null, status: "TODO" as const, priority: "HIGH" as const, dueDate: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt }],
      sessions: [], tags: [], englishSkills: [], englishEntries: [],
    };
    const parsed = parseBackupPayload({ ...payload, data: { ...payload.data, learningAreas: [area] } });
    expect(parsed.data.learningAreas?.[0].todos[0].itemId).toBe("item-child");
    expect(() => parseBackupPayload({ ...payload, data: { ...payload.data, learningAreas: [{ ...area, todos: [{ ...area.todos[0], itemId: "missing" }] }] } })).toThrow("yapılacağı");
  });

  it("preserves rich topic content and validates topic-scoped notes and goals", () => {
    const item = { id: "item-rich", ownerId: "owner-1", areaId: "area-rich", parentId: null, title: "Terminal", description: "Kendi laboratuvarında çalışma", summary: "Terminal özeti", content: "Terminalin ayrıntılı içeriği", requirements: "Yerel sanal makine", goals: "Dosya sistemini tanımak", type: "TOPIC" as const, position: 1, estimatedMinutes: 30, notes: null, externalUrl: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] };
    const area = { id: "area-rich", ownerId: "owner-1", slug: "kali-linux", name: "Kali Linux", description: null, group: "TECHNOLOGY" as const, category: null, subCategory: null, level: "BEGINNER" as const, status: "PLANNED" as const, progress: 0, estimatedMinutes: null, prerequisites: null, notes: null, lastWorkedAt: null, completedAt: null, englishLevel: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, items: [item], todos: [], sessions: [], tags: [], englishSkills: [], englishEntries: [] };
    const note = { id: "note-rich", ownerId: "owner-1", learningAreaId: area.id, learningItemId: item.id, title: "İlk not", content: "Komutları kendi makinemde denedim.", category: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, tags: [] };
    const goal = { id: "goal-rich", ownerId: "owner-1", learningAreaId: area.id, learningItemId: item.id, title: "Dosya işlemlerini tamamla", description: null, targetValue: null, currentValue: null, dueDate: null, completedAt: null, createdAt: payload.exportedAt, updatedAt: payload.exportedAt, milestones: [] };
    const richPayload = { ...payload, data: { ...payload.data, learningAreas: [area], notes: [note], goals: [goal] } };
    const result = parseBackupPayload(richPayload);
    expect(result.data.learningAreas?.[0].items[0].content).toBe(item.content);
    expect(result.data.notes[0].learningItemId).toBe(item.id);
    expect(result.data.goals[0].learningItemId).toBe(item.id);
    expect(() => parseBackupPayload({ ...richPayload, data: { ...richPayload.data, notes: [{ ...note, learningItemId: "missing" }] } })).toThrow("Öğrenme notu geçersiz bir konuya");
    expect(() => parseBackupPayload({ ...richPayload, data: { ...richPayload.data, goals: [{ ...goal, learningItemId: "missing" }] } })).toThrow("Öğrenme hedefi geçersiz bir konuya");
  });
});
