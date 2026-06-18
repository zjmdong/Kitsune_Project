const currencyLocales: Record<string, string> = {
  HKD: "en-HK",
  USD: "en-US",
  SGD: "en-SG",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
  CNY: "zh-CN"
};

export function formatCurrency(value: number, options?: { compact?: boolean; currency?: string }) {
  const currency = options?.currency ?? "HKD";
  return new Intl.NumberFormat(currencyLocales[currency] ?? "en-HK", {
    style: "currency",
    currency,
    maximumFractionDigits: options?.compact ? 1 : 2,
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
