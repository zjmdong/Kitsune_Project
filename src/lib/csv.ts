import Papa from "papaparse";
import type { SalesRecord } from "./types";

type CsvRow = Record<string, string | number | undefined>;

function toNumber(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number(String(value ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toChannel(value: unknown): SalesRecord["channel"] {
  const text = String(value ?? "").trim().toLowerCase();
  if (text.includes("pickup") || text.includes("pick-up")) return "Takeaway";
  if (text.includes("take")) return "Takeaway";
  if (text.includes("deliver")) return "Delivery";
  if (text.includes("retail")) return "Retail";
  if (text.includes("cater")) return "Catering";
  return "Dine-in";
}

function toHour(row: CsvRow) {
  const directHour = toNumber(row.hour, Number.NaN);
  if (Number.isFinite(directHour)) {
    return directHour;
  }

  const time = String(row.sale_time ?? row.time ?? "").trim();
  const match = /^(\d{1,2})/.exec(time);
  return match ? Number(match[1]) : 12;
}

export function parseSalesCsv(csvText: string): SalesRecord[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  return result.data
    .map((row) => {
      const date = String(row.date ?? row.day ?? row.sale_date ?? "").trim();
      const product = String(row.product ?? row.item ?? "Unknown Item").trim();
      const revenue = toNumber(row.revenue ?? row.sales ?? row.net_sales_usd ?? row.gross_sales_usd);
      const cost = toNumber(row.cost ?? row.cogs ?? row.total_ingredient_cost_usd ?? row.base_ingredient_cost_usd, revenue * 0.34);
      return {
        date,
        hour: Math.max(0, Math.min(23, Math.round(toHour(row)))),
        product,
        category: String(row.category ?? "General").trim(),
        units: Math.max(1, Math.round(toNumber(row.units ?? row.quantity, 1))),
        revenue,
        cost,
        channel: toChannel(row.channel)
      };
    })
    .filter((record) => record.date && record.product && record.revenue > 0);
}
