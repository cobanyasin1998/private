import { Prisma } from "@prisma/client";

/** Transfers are only implicit conversions when both legs use the same currency. */
export function canTransferCurrencies(sourceCurrency: string, destinationCurrency: string) {
  return sourceCurrency.toUpperCase() === destinationCurrency.toUpperCase();
}

/** The source leg is negative and the destination leg positive; both remain TRANSFER rows. */
export function transferLegAmounts(amount: Prisma.Decimal) {
  return { source: amount.negated(), destination: amount };
}
