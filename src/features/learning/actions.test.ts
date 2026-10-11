import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getSessionOwner: vi.fn() }));
const areaQueries = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn() }));
const itemQueries = vi.hoisted(() => ({ findFirst: vi.fn() }));
const noteQueries = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }));
const goalQueries = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({ getSessionOwner: auth.getSessionOwner }));
vi.mock("@/lib/db", () => ({ db: { learningArea: areaQueries, learningItem: itemQueries, note: noteQueries, goal: goalQueries } }));
vi.mock("@/lib/activity/events", () => ({ recordActivity: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createLearningArea, createLearningNote, createLearningGoal, setLearningAreaProgress, updateLearningNote, updateLearningGoal } from "./actions";

beforeEach(() => {
  vi.resetAllMocks();
  auth.getSessionOwner.mockResolvedValue(null);
});

describe("learning action authorization", () => {
  it("rejects mutations without an authenticated owner", async () => {
    const result = await createLearningArea({ name: "Python", group: "TECHNOLOGY" });
    expect(result).toEqual({ ok: false, error: "Oturumunuz sona ermiş. Tekrar giriş yapın." });
    expect(areaQueries.findFirst).not.toHaveBeenCalled();
  });

  it("does not mutate another owner's area", async () => {
    auth.getSessionOwner.mockResolvedValue({ id: "owner-a" });
    areaQueries.findFirst.mockResolvedValue(null);
    const result = await setLearningAreaProgress({ id: "cmj2q4s5p0000abcde1234567", progress: 50 });
    expect(result).toEqual({ ok: false, error: "Öğrenme alanı bulunamadı." });
    expect(areaQueries.update).not.toHaveBeenCalled();
    expect(areaQueries.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cmj2q4s5p0000abcde1234567", ownerId: "owner-a" } }));
  });

  it.each([
    { action: createLearningNote, queries: noteQueries, input: { title: "Not", content: "İçerik" }, error: "Not geçerli bir konuya bağlanmalı." },
    { action: createLearningGoal, queries: goalQueries, input: { title: "Hedef" }, error: "Hedef geçerli bir konuya bağlanmalı." },
  ])("does not attach new notes or goals to a topic from another owner", async ({ action, queries, input, error }) => {
    auth.getSessionOwner.mockResolvedValue({ id: "owner-a" });
    areaQueries.findFirst.mockResolvedValue({ id: "cmj2q4s5p0000abcde1234567" });
    itemQueries.findFirst.mockResolvedValue(null);
    const result = await action({ ...input, areaId: "cmj2q4s5p0000abcde1234567", itemId: "cmj2q4s5p0000abcde1234568" });
    expect(result).toEqual({ ok: false, error });
    expect(queries.create).not.toHaveBeenCalled();
    expect(itemQueries.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cmj2q4s5p0000abcde1234568", ownerId: "owner-a", areaId: "cmj2q4s5p0000abcde1234567" } }));
  });

  it.each([
    { action: updateLearningNote, queries: noteQueries, input: { title: "Not", content: "İçerik" }, error: "Not geçerli bir konuya bağlanmalı." },
    { action: updateLearningGoal, queries: goalQueries, input: { title: "Hedef" }, error: "Hedef geçerli bir konuya bağlanmalı." },
  ])("does not move existing notes or goals to a topic from another owner", async ({ action, queries, input, error }) => {
    auth.getSessionOwner.mockResolvedValue({ id: "owner-a" });
    queries.findFirst.mockResolvedValue({ id: "cmj2q4s5p0000abcde1234569", learningAreaId: "cmj2q4s5p0000abcde1234567", learningItemId: null });
    itemQueries.findFirst.mockResolvedValue(null);
    const result = await action({ ...input, id: "cmj2q4s5p0000abcde1234569", areaId: "cmj2q4s5p0000abcde1234567", itemId: "cmj2q4s5p0000abcde1234568" });
    expect(result).toEqual({ ok: false, error });
    expect(queries.update).not.toHaveBeenCalled();
    expect(queries.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cmj2q4s5p0000abcde1234569", ownerId: "owner-a", learningAreaId: "cmj2q4s5p0000abcde1234567" } }));
  });
});
