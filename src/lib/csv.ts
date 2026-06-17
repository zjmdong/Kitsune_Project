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
  if (text.includes("take")) return "Takeaway";
  if (text.includes("deliver")) return "Delivery";
  if (text.includes("retail")) return "Retail";
  if (text.includes("cater")) return "Catering";
  return "Dine-in";
}

export function parseSalesCsv(csvText: string): SalesRecord[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  return result.data
    .map((row) => {
      const date = String(row.date ?? row.day ?? "").trim();
      const product = String(row.product ?? row.item ?? "Unknown Item").trim();
      const revenue = toNumber(row.revenue ?? row.sales);
      const cost = toNumber(row.cost ?? row.cogs, revenue * 0.34);
      return {
        date,
        hour: Math.max(0, Math.min(23, Math.round(toNumber(row.hour, 12)))),
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
