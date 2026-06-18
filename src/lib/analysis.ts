import type {
  AnalysisResult,
  BusinessProfile,
  DistrictMetric,
  LocationRecommendation,
  RankedItem,
  ReadinessScore,
  SalesRecord
} from "./types";

const hkStaffCost = 17000;

type AnalysisOptions = {
  staffCostMonthly?: number;
  currencyCode?: string;
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = keyFn(item);
    groups[key] = groups[key] ?? [];
    groups[key].push(item);
    return groups;
  }, {});
}

function rankedFromGroups(
  groups: Record<string, SalesRecord[]>,
  totalRevenue: number,
  direction: "desc" | "asc" = "desc"
): RankedItem[] {
  return Object.entries(groups)
    .map(([name, records]) => {
      const value = sum(records.map((record) => record.revenue));
      const units = sum(records.map((record) => record.units));
      return {
        name,
        value,
        units,
        share: totalRevenue > 0 ? value / totalRevenue : 0
      };
    })
    .sort((a, b) => (direction === "desc" ? b.value - a.value : a.value - b.value));
}

function getTrend(series: { revenue: number }[]) {
  if (series.length < 14) {
    return 0;
  }

  const windowSize = Math.min(14, Math.floor(series.length / 2));
  const first = sum(series.slice(0, windowSize).map((point) => point.revenue)) / windowSize;
  const last = sum(series.slice(-windowSize).map((point) => point.revenue)) / windowSize;
  return first > 0 ? (last - first) / first : 0;
}

export function analyzeBusiness(records: SalesRecord[], profile: BusinessProfile, options: AnalysisOptions = {}): AnalysisResult {
  if (records.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      grossMargin: 0,
      estimatedMonthlyRevenue: 0,
      estimatedMonthlyProfit: 0,
      revenueTrend: 0,
      peakHour: 0,
      peakHourRevenue: 0,
      bestProducts: [],
      worstProducts: [],
      categoryMix: [],
      channelMix: [],
      dailySeries: [],
      hourlySeries: [],
      operatingRisks: ["No sales data has been loaded."],
    };
  }

  const totalRevenue = sum(records.map((record) => record.revenue));
  const totalCost = sum(records.map((record) => record.cost));
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

  const dailyGroups = groupBy(records, (record) => record.date);
  const dailySeries = Object.entries(dailyGroups)
    .map(([date, dayRecords]) => {
      const revenue = sum(dayRecords.map((record) => record.revenue));
      const cost = sum(dayRecords.map((record) => record.cost));
      return {
        date,
        revenue,
        cost,
        profit: revenue - cost
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const hourlySeries = Object.entries(groupBy(records, (record) => String(record.hour)))
    .map(([hour, hourRecords]) => ({
      hour: `${hour}:00`,
      revenue: sum(hourRecords.map((record) => record.revenue))
    }))
    .sort((a, b) => Number.parseInt(a.hour, 10) - Number.parseInt(b.hour, 10));

  const peak = hourlySeries.reduce(
    (best, point) => (point.revenue > best.revenue ? point : best),
    { hour: "0:00", revenue: 0 }
  );

  const dayCount = Math.max(1, dailySeries.length);
  const estimatedMonthlyRevenue = (totalRevenue / dayCount) * 30.4;
  const estimatedMonthlyCost = (totalCost / dayCount) * 30.4;
  const staffCostMonthly = options.staffCostMonthly ?? hkStaffCost;
  const payroll = profile.staffCount * staffCostMonthly;
  const otherOverhead = estimatedMonthlyRevenue * 0.08;
  const estimatedMonthlyProfit =
    estimatedMonthlyRevenue - estimatedMonthlyCost - profile.monthlyRent - payroll - otherOverhead;

  const bestProducts = rankedFromGroups(groupBy(records, (record) => record.product), totalRevenue).slice(0, 5);
  const worstProducts = rankedFromGroups(groupBy(records, (record) => record.product), totalRevenue, "asc").slice(0, 5);
  const categoryMix = rankedFromGroups(groupBy(records, (record) => record.category), totalRevenue).slice(0, 6);
  const channelMix = rankedFromGroups(groupBy(records, (record) => record.channel), totalRevenue).slice(0, 5);
  const revenueTrend = getTrend(dailySeries);

  const topProductShare = bestProducts[0]?.share ?? 0;
  const deliveryShare = channelMix.find((item) => item.name === "Delivery")?.share ?? 0;
  const operatingRisks = [
    grossMargin < 0.58 ? "Gross margin is below the target range for a premium dine-in concept." : "",
    estimatedMonthlyProfit < estimatedMonthlyRevenue * 0.08
      ? "Estimated operating buffer is thin after rent, payroll, and overhead."
      : "",
    topProductShare > 0.28 ? "Revenue is concentrated in one hero product." : "",
    deliveryShare > 0.35 ? "Delivery share is high, so commission pressure should be monitored." : "",
    revenueTrend < -0.03 ? "Recent revenue trend is declining." : ""
  ].filter(Boolean);

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    grossMargin,
    estimatedMonthlyRevenue,
    estimatedMonthlyProfit,
    revenueTrend,
    peakHour: Number.parseInt(peak.hour, 10),
    peakHourRevenue: peak.revenue,
    bestProducts,
    worstProducts,
    categoryMix,
    channelMix,
    dailySeries,
    hourlySeries,
    operatingRisks
  };
}

function factor(label: string, score: number, max: number, note: string) {
  return {
    label,
    score: Math.max(0, Math.min(max, Math.round(score))),
    max,
    note
  };
}

export function calculateReadiness(analysis: AnalysisResult, profile: BusinessProfile): ReadinessScore {
  const profitRatio =
    analysis.estimatedMonthlyRevenue > 0
      ? analysis.estimatedMonthlyProfit / analysis.estimatedMonthlyRevenue
      : 0;
  const budgetMonths =
    analysis.estimatedMonthlyProfit > 0 ? profile.expansionBudget / analysis.estimatedMonthlyProfit : 0;
  const topProductShare = analysis.bestProducts[0]?.share ?? 0;

  const factors = [
    factor(
      "Revenue momentum",
      20 * Math.min(1, Math.max(0.15, (analysis.revenueTrend + 0.08) / 0.22)),
      20,
      analysis.revenueTrend >= 0.08 ? "Strong recent growth." : "Growth is positive but should be reinforced."
    ),
    factor(
      "Gross margin",
      20 * Math.min(1, analysis.grossMargin / 0.68),
      20,
      analysis.grossMargin >= 0.62 ? "Healthy margin for a restaurant concept." : "Menu engineering can improve margin."
    ),
    factor(
      "Operating buffer",
      22 * Math.min(1, Math.max(0, profitRatio) / 0.16),
      22,
      profitRatio >= 0.12 ? "Profit buffer can support a second-store ramp." : "Cash buffer is still sensitive."
    ),
    factor(
      "Expansion capital",
      18 * Math.min(1, budgetMonths / 8),
      18,
      budgetMonths >= 6 ? "Budget covers a practical launch runway." : "Budget should be staged carefully."
    ),
    factor(
      "Demand diversity",
      10 * Math.min(1, Math.max(0.2, (0.34 - topProductShare) / 0.2)),
      10,
      topProductShare < 0.24 ? "Sales are not over-dependent on one item." : "Hero item dependence needs a backup plan."
    ),
    factor(
      "Team capacity",
      10 * Math.min(1, profile.staffCount / 18),
      10,
      profile.staffCount >= 14 ? "Team size is ready for manager training." : "More shift leadership is needed."
    )
  ];

  const score = factors.reduce((total, item) => total + item.score, 0);
  const riskLevel = score >= 74 ? "Low" : score >= 56 ? "Medium" : "High";
  const verdict =
    score >= 74
      ? "Expansion ready with a staged second-store launch."
      : score >= 56
        ? "Promising, but validate unit economics before signing a lease."
        : "Strengthen the core store before committing to expansion.";

  return {
    score,
    riskLevel,
    verdict,
    factors
  };
}

export function rankLocations(
  districts: DistrictMetric[],
  profile: BusinessProfile,
  analysis: AnalysisResult,
  options: AnalysisOptions = {}
): LocationRecommendation[] {
  const currencyCode = options.currencyCode ?? "HKD";
  const staffCostMonthly = options.staffCostMonthly ?? hkStaffCost;
  const budgetRentCeiling = Math.max(profile.monthlyRent * 1.05, profile.expansionBudget * 0.09);
  const monthlyRevenue = Math.max(analysis.estimatedMonthlyRevenue, profile.weeklyTransactions * profile.averageTicket * 4.3);

  return districts
    .map((district) => {
      const estimatedMonthlyRent =
        currencyCode === "USD"
          ? Math.round(2800 + district.rentIndex * 52)
          : Math.round(52000 + district.rentIndex * 1450);
      const rentAffordability = Math.max(0, Math.min(100, 100 - ((estimatedMonthlyRent - budgetRentCeiling) / budgetRentCeiling) * 100));
      const competitionScore = 100 - district.competitionIndex;
      const revenuePotential = monthlyRevenue * (0.72 + district.footfallIndex / 250 + district.targetFitIndex / 400);
      const monthlyStoreProfit =
        revenuePotential * analysis.grossMargin - estimatedMonthlyRent - profile.staffCount * 0.7 * staffCostMonthly - revenuePotential * 0.1;
      const openingCost =
        currencyCode === "USD"
          ? estimatedMonthlyRent * 4 + 120000
          : estimatedMonthlyRent * 5 + 650000;
      const paybackMonths =
        monthlyStoreProfit > 0 ? Math.round((openingCost / monthlyStoreProfit) * 10) / 10 : 99;

      const score =
        district.targetFitIndex * 0.26 +
        district.footfallIndex * 0.21 +
        district.transitIndex * 0.15 +
        rentAffordability * 0.21 +
        competitionScore * 0.11 +
        Math.min(100, analysis.grossMargin * 140) * 0.06;

      const risks = [
        district.rentIndex > 85 ? "High rental pressure" : "",
        district.competitionIndex > 78 ? "Dense restaurant competition" : "",
        paybackMonths > 18 ? "Longer payback window" : ""
      ].filter(Boolean);

      return {
        district: district.district,
        score: Math.round(score),
        estimatedMonthlyRent,
        paybackMonths,
        fit: district.audience,
        risks,
        reasons: [
          `${district.footfallIndex}/100 footfall index`,
          `${district.targetFitIndex}/100 target customer fit`,
          `${Math.round(rentAffordability)}/100 rent affordability`
        ],
        metrics: district
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildCsvTemplate(records: SalesRecord[]) {
  const header = "date,hour,product,category,units,revenue,cost,channel";
  const rows = records
    .slice(0, 90)
    .map((record) =>
      [
        record.date,
        record.hour,
        record.product,
        record.category,
        record.units,
        record.revenue,
        record.cost,
        record.channel
      ].join(",")
    );

  return [header, ...rows].join("\n");
}
