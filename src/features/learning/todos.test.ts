import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getSessionOwner: vi.fn() }));
const todos = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }));
const areas = vi.hoisted(() => ({ findFirst: vi.fn() }));
const items = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({ getSessionOwner: auth.getSessionOwner }));
vi.mock("@/lib/db", () => ({ db: { learningTodo: todos, learningArea: areas, learningItem: items } }));
vi.mock("@/lib/activity/events", () => ({ recordActivity: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { setLearningTodoCompleted } from "./actions";

beforeEach(() => {
  vi.resetAllMocks();
  auth.getSessionOwner.mockResolvedValue({ id: "owner-a" });
});

describe("learning todo owner isolation", () => {
  it("does not complete another owner's todo", async () => {
    todos.findFirst.mockResolvedValue(null);
    const result = await setLearningTodoCompleted({ id: "cmj2q4s5p0000abcde1234567", completed: true });
    expect(result).toEqual({ ok: false, error: "Yapılacak bulunamadı." });
    expect(todos.update).not.toHaveBeenCalled();
    expect(todos.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cmj2q4s5p0000abcde1234567", ownerId: "owner-a" } }));
  });
});
