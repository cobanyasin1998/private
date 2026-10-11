import { describe, expect, it } from "vitest";
import { accountInputSchema, budgetInputSchema, transactionInputSchema, transferInputSchema } from "./schemas";

describe("finance schemas", () => {
  it("accepts exact decimal amounts with comma separators", () => {
    expect(accountInputSchema.parse({ name: "Banka", type: "BANK", currency: "try", openingBalance: "12.3456" }).openingBalance).toBe("12.3456");
    expect(transactionInputSchema.parse({ accountId: "ckz4j5p4z0000abcde1234567", type: "EXPENSE", amount: "19,90", occurredAt: "2026-10-11", description: "Market" }).amount).toBe("19,90");
  });

  it("rejects zero and malformed transaction amounts", () => {
    expect(transactionInputSchema.safeParse({ accountId: "ckz4j5p4z0000abcde1234567", type: "EXPENSE", amount: "0", occurredAt: "2026-10-11", description: "Market" }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ accountId: "ckz4j5p4z0000abcde1234567", type: "EXPENSE", amount: "1.23456", occurredAt: "2026-10-11", description: "Market" }).success).toBe(false);
  });

  it("requires distinct accounts for transfers", () => {
    const input = { sourceAccountId: "ckz4j5p4z0000abcde1234567", destinationAccountId: "ckz4j5p4z0000abcde1234567", amount: "100", occurredAt: "2026-10-11" };
    expect(transferInputSchema.safeParse(input).success).toBe(false);
    expect(transferInputSchema.safeParse({ ...input, destinationAccountId: "ckz4j5p4z0000abcde1234588" }).success).toBe(true);
  });

  it("validates monthly budget allocations and rejects duplicate categories", () => {
    const categoryId = "ckz4j5p4z0000abcde1234567";
    const valid = budgetInputSchema.safeParse({ month: "2026-10", name: "Ekim", currency: "try", allocations: [{ categoryId, amount: "1000" }] });
    expect(valid.success).toBe(true);
    const duplicate = budgetInputSchema.safeParse({ month: "2026-10", name: "Ekim", currency: "TRY", allocations: [{ categoryId, amount: "1000" }, { categoryId, amount: "200" }] });
    expect(duplicate.success).toBe(false);
  });
});
