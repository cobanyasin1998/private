import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { calculateBalance } from "./queries";

describe("finance balance rules", () => {
  it("subtracts expenses and applies signed transfer legs without treating transfers as income", () => {
    const balance = calculateBalance(new Prisma.Decimal("100"), [
      { type: "INCOME", amount: new Prisma.Decimal("25.50") },
      { type: "EXPENSE", amount: new Prisma.Decimal("10.25") },
      { type: "TRANSFER", amount: new Prisma.Decimal("-40") },
    ]);
    expect(balance.toString()).toBe("75.25");
  });
});
