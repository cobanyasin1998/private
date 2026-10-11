import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLearningAreaBySlug, getLearningAreas, getLearningItem, getTravelPlaces } from "./queries";

const queries = vi.hoisted(() => ({ areas: vi.fn(), areaFirst: vi.fn(), itemFirst: vi.fn(), places: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { learningArea: { findMany: queries.areas, findFirst: queries.areaFirst }, learningItem: { findFirst: queries.itemFirst }, travelPlace: { findMany: queries.places, findFirst: vi.fn() } } }));

beforeEach(() => {
  vi.resetAllMocks();
  queries.areas.mockResolvedValue([]);
  queries.areaFirst.mockResolvedValue(null);
  queries.itemFirst.mockResolvedValue(null);
  queries.places.mockResolvedValue([]);
});

describe("learning owner scoping", () => {
  it("always scopes area reads to the requested owner", async () => {
    await getLearningAreas("owner-a", { group: "TECHNOLOGY" });
    expect(queries.areas).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "owner-a", group: "TECHNOLOGY" } }));
  });

  it("always scopes travel reads to the requested owner", async () => {
    await getTravelPlaces("owner-b", { status: "WISHLIST" });
    expect(queries.places).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "owner-b", status: "WISHLIST" } }));
  });

  it("scopes area detail reads by both owner and stable slug", async () => {
    await getLearningAreaBySlug("owner-a", "kali-linux");
    expect(queries.areaFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: "owner-a", slug: "kali-linux" } }));
  });

  it("does not expose a topic belonging to another owner", async () => {
    const result = await getLearningItem("owner-a", "cmj2q4s5p0000abcde1234567", "area-a");
    expect(result).toBeNull();
    expect(queries.itemFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cmj2q4s5p0000abcde1234567", ownerId: "owner-a", areaId: "area-a" } }));
  });
});
