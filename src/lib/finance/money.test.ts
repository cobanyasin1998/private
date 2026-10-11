import { describe, expect, it } from "vitest";
import { formatMinorUnits, netCashFlow, parseMinorUnits, sumMinorUnits } from "@/lib/finance/money";

describe("money helpers", () => {
  it("parses decimal values without floating point arithmetic", () => {
    expect(parseMinorUnits("1234,56")).toBe(123456n);
    expect(parseMinorUnits("-10.5")).toBe(-1050n);
  });
  it("keeps transfers and cash flow calculations exact", () => {
    expect(sumMinorUnits([100n, 250n, 50n])).toBe(400n);
    expect(netCashFlow(10000n, 2750n)).toBe(7250n);
  });
  it("formats a minor unit amount with its currency", () => {
    expect(formatMinorUnits(12345n, "TRY", "tr-TR")).toContain("123,45");
  });
});
