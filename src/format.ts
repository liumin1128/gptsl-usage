const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSpend(spend: number): string {
  if (!Number.isFinite(spend)) {
    return "$--.--";
  }

  return USD_FORMATTER.format(spend);
}
