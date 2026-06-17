export function formatCurrency(value: number, options?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
    notation: options?.compact ? "compact" : "standard"
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-HK", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-HK", {
    maximumFractionDigits: 0
  }).format(value);
}
