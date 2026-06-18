import type { AnalysisPayload, DistrictMetric } from "./types";

const lasVegasDistrictMetrics: DistrictMetric[] = [
  {
    district: "Chinatown / Spring Valley",
    rentIndex: 58,
    footfallIndex: 82,
    competitionIndex: 76,
    targetFitIndex: 91,
    transitIndex: 70,
    audience: "Asian-American residents, students, food explorers, tourists, late-afternoon snack traffic",
    notes: "Best match for Gong Cha's current audience, brand recognition, and Spring Mountain food corridor demand."
  },
  {
    district: "UNLV / Paradise",
    rentIndex: 54,
    footfallIndex: 79,
    competitionIndex: 68,
    targetFitIndex: 86,
    transitIndex: 76,
    audience: "College students, young workers, convention spillover, delivery customers",
    notes: "Strong student and young professional fit, with repeat snack-and-drink occasions."
  },
  {
    district: "Summerlin",
    rentIndex: 72,
    footfallIndex: 77,
    competitionIndex: 61,
    targetFitIndex: 78,
    transitIndex: 64,
    audience: "Families, suburban professionals, teen groups, higher-income local residents",
    notes: "Good family and suburban repeat market, but rents and car-dependent traffic require careful site selection."
  },
  {
    district: "Henderson",
    rentIndex: 62,
    footfallIndex: 73,
    competitionIndex: 55,
    targetFitIndex: 74,
    transitIndex: 61,
    audience: "Families, local residents, school traffic, delivery customers",
    notes: "Lower competition and strong residential repeat potential, suited to a disciplined second-store test."
  },
  {
    district: "Downtown Arts District",
    rentIndex: 64,
    footfallIndex: 69,
    competitionIndex: 58,
    targetFitIndex: 66,
    transitIndex: 68,
    audience: "Tourists, creators, nightlife visitors, young professionals",
    notes: "Brand-building potential, but demand may skew event-driven and less predictable."
  },
  {
    district: "Enterprise / Southwest Las Vegas",
    rentIndex: 57,
    footfallIndex: 66,
    competitionIndex: 49,
    targetFitIndex: 70,
    transitIndex: 54,
    audience: "Growing residential neighborhoods, families, delivery and pickup customers",
    notes: "Emerging residential fit with lower rent pressure, but needs stronger local awareness marketing."
  }
];

export function inferCurrencyCode(payload: AnalysisPayload) {
  const marketText = `${payload.profile.city} ${payload.profile.area} ${payload.profile.businessName}`.toLowerCase();
  if (/(las vegas|nevada|usa|united states|spring valley)/.test(marketText)) return "USD";
  if (/(hong kong|hku|kowloon|wan chai|causeway bay|central|sha tin|kwun tong)/.test(marketText)) return "HKD";
  if (/(singapore)/.test(marketText)) return "SGD";
  if (/(london|united kingdom| uk\b|england)/.test(marketText)) return "GBP";
  if (/(canada|toronto|vancouver)/.test(marketText)) return "CAD";
  if (/(australia|sydney|melbourne)/.test(marketText)) return "AUD";
  if (/(japan|tokyo|osaka)/.test(marketText)) return "JPY";
  if (/(china|shanghai|beijing|shenzhen|guangzhou)/.test(marketText)) return "CNY";
  return "HKD";
}

export function getMarketLabel(payload: AnalysisPayload) {
  return [payload.profile.area, payload.profile.city].filter(Boolean).join(", ") || "the stated local market";
}

export function getMonthlyStaffCost(payload: AnalysisPayload, currencyCode = inferCurrencyCode(payload)) {
  if (payload.financials.laborCost && payload.profile.employees > 0) {
    return payload.financials.laborCost / payload.profile.employees;
  }

  const defaults: Record<string, number> = {
    USD: 3200,
    HKD: 17000,
    SGD: 3600,
    GBP: 2600,
    CAD: 3600,
    AUD: 3900,
    JPY: 320000,
    CNY: 9000
  };
  return defaults[currencyCode] ?? defaults.HKD;
}

export function getExpansionBudget(currencyCode: string) {
  const budgets: Record<string, number> = {
    USD: 120000,
    HKD: 1450000,
    SGD: 160000,
    GBP: 110000,
    CAD: 150000,
    AUD: 170000,
    JPY: 18000000,
    CNY: 800000
  };
  return budgets[currencyCode] ?? budgets.HKD;
}

export function getDistrictMetricsForPayload(payload: AnalysisPayload, fallback: DistrictMetric[]) {
  const marketText = `${payload.profile.city} ${payload.profile.area}`.toLowerCase();
  if (/(las vegas|nevada|spring valley)/.test(marketText)) {
    return lasVegasDistrictMetrics;
  }
  return fallback;
}

export function getMarketInstruction(payload: AnalysisPayload) {
  const currencyCode = inferCurrencyCode(payload);
  const marketLabel = getMarketLabel(payload);
  return `Use ${marketLabel} as the local market context and ${currencyCode} as the reporting currency. Do not default to Hong Kong districts, costs, rents, or benchmarks unless the input market is Hong Kong.`;
}
