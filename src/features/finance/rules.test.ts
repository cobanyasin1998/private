import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { canTransferCurrencies, transferLegAmounts } from "./rules";

describe("finance transfer invariants", () => {
  it("requires an explicit conversion rule for mixed currencies", () => {
    expect(canTransferCurrencies("TRY", "try")).toBe(true);
    expect(canTransferCurrencies("TRY", "USD")).toBe(false);
  });

  it("creates balanced signed transfer legs", () => {
    const legs = transferLegAmounts(new Prisma.Decimal("12.3400"));
    expect(legs.source.toString()).toBe("-12.34");
    expect(legs.destination.toString()).toBe("12.34");
  });
});
