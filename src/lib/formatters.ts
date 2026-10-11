export function formatCurrency(value: number | string, currency = "TRY", locale = "tr-TR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}

export function formatDate(value: Date | string | number, locale = "tr-TR") {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}
