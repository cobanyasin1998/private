export function parseMinorUnits(value: string, fractionDigits = 2): bigint {
  const normalized = value.trim().replace(",", ".");
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error("Invalid monetary amount");
  const sign = match[1] === "-" ? -1n : 1n;
  const fraction = (match[3] ?? "").padEnd(fractionDigits, "0");
  if (fraction.length > fractionDigits && /[^0]/.test(fraction.slice(fractionDigits))) throw new Error("Too many decimal places");
  return sign * (BigInt(match[2]) * 10n ** BigInt(fractionDigits) + BigInt(fraction.slice(0, fractionDigits) || "0"));
}

export function sumMinorUnits(values: readonly bigint[]) { return values.reduce((total, value) => total + value, 0n); }
export function netCashFlow(income: bigint, expenses: bigint) { return income - expenses; }

export function formatMinorUnits(value: bigint, currency = "TRY", locale = "tr-TR", fractionDigits = 2) {
  const base = 10n ** BigInt(fractionDigits);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const integer = absolute / base;
  const fraction = (absolute % base).toString().padStart(fractionDigits, "0");
  const formatted = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(Number(`${integer}.${fraction}`));
  return negative ? `-${formatted}` : formatted;
}
