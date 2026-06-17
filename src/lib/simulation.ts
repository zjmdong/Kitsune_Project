import { analyzeBusiness, calculateReadiness, rankLocations } from "./analysis";
import { createDesignBrief, createMarketingPlan } from "./report";
import { createSampleSalesRecords, districtMetrics } from "./sample-data";
import type {
  AnalysisPayload,
  BusinessProfile,
  FinalConsultantReport,
  LocationRecommendation,
  RankedItem,
  SalesRecord
} from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function toBusinessProfile(payload: AnalysisPayload): BusinessProfile {
  const monthlyRevenue =
    payload.financials.monthlyRevenue ?? (payload.financials.dailyRevenue ? payload.financials.dailyRevenue * 30 : 780000);
  const averageTicket =
    payload.profile.averageSpendPerCustomer ??
    (payload.profile.dailyCustomerCount ? monthlyRevenue / 30 / payload.profile.dailyCustomerCount : 188);

  return {
    businessName: payload.profile.businessName,
    category: payload.profile.businessType,
    currentDistrict: payload.profile.area,
    positioning: payload.profile.businessSize === "Chain" ? "Premium" : "Mid-market",
    cuisineOrProduct: payload.profile.businessType,
    monthlyRent: payload.financials.rentCost ?? 120000,
    staffCount: payload.profile.employees,
    weeklyTransactions: Math.round((payload.profile.dailyCustomerCount ?? 150) * 7),
    averageTicket,
    expansionBudget: 1450000,
    targetCustomer: payload.profile.customerSegments,
    ownerGoal: payload.profile.goals.join(", ")
  };
}

function prepareRecords(payload: AnalysisPayload): SalesRecord[] {
  if (payload.salesRecords.length > 0) {
    return payload.salesRecords;
  }

  return createSampleSalesRecords();
}

function byProfit(items: RankedItem[]): RankedItem[] {
  return items.map((item) => ({ ...item, value: Math.round(item.value * 0.62) }));
}

function lowMargin(items: RankedItem[]): RankedItem[] {
  return [...items].reverse().map((item, index) => ({
    ...item,
    value: Math.round(item.value * (0.18 + index * 0.015))
  }));
}

function buildConsultingNotes(
  payload: AnalysisPayload,
  topLocation: LocationRecommendation | undefined,
  growthRate: number,
  grossMargin: number
) {
  const trend =
    growthRate >= 0.08
      ? "The business is growing with a clear upward revenue trend, especially around lunch and dinner peaks."
      : growthRate >= 0
        ? "The business is stable but needs stronger demand creation before aggressive expansion."
        : "The business is declining and should repair traffic and retention before expansion.";

  return {
    trend,
    bottlenecks: [
      `${payload.profile.offPeakHours || "Off-peak hours"} are underused and should be targeted with bundles or labor adjustments.`,
      payload.profile.employees > 18
        ? "Staffing may be too heavy for a single-store operation."
        : "The current team can support a staged manager-training plan.",
      "Marketing is still channel-led rather than CRM-led, limiting repeat customer growth."
    ],
    leakage: [
      grossMargin < 0.62
        ? "Ingredient/product costs are compressing gross margin."
        : "Gross margin is healthy, but low-volume items still create menu complexity.",
      (payload.financials.wasteRate ?? 0) > 5
        ? "Waste rate is above the preferred range and should be tracked by product family."
        : "Waste rate is manageable but should be monitored before a second-store launch.",
      "Unused off-peak capacity is the main profit leakage opportunity."
    ],
    benchmarking: [
      grossMargin >= 0.62
        ? "Gross margin is above a typical casual dining benchmark."
        : "Gross margin is below what similar premium restaurants usually need.",
      topLocation
        ? `${topLocation.district} provides a stronger balance of rent affordability and target-customer fit than premium CBD zones.`
        : "Location benchmarking needs more local market data.",
      "Average order value is strong for a single-store SME restaurant."
    ],
    scenarios: [
      "+8% lunch price optimization can lift revenue without changing capacity if paired with value framing.",
      "Removing the bottom 20% low-margin items can reduce prep complexity and improve throughput.",
      "A district-specific launch campaign can improve opening-month revenue by 8-14%."
    ]
  };
}

export function generateSimulatedReport(payload: AnalysisPayload): FinalConsultantReport {
  const profile = toBusinessProfile(payload);
  const records = prepareRecords(payload);
  const analysis = analyzeBusiness(records, profile);
  const readiness = calculateReadiness(analysis, profile);
  const locations = rankLocations(districtMetrics, profile, analysis);
  const marketingStrategy = createMarketingPlan(profile, analysis, locations);
  const designBrief = createDesignBrief(profile);
  const monthlyRevenue = payload.financials.monthlyRevenue ?? analysis.estimatedMonthlyRevenue;
  const netProfit = payload.financials.netProfit ?? analysis.estimatedMonthlyProfit;
  const grossMargin = payload.financials.grossMargin ? payload.financials.grossMargin / 100 : analysis.grossMargin;
  const costTotal =
    (payload.financials.rentCost ?? profile.monthlyRent) +
    (payload.financials.laborCost ?? profile.staffCount * 17000) +
    (payload.financials.ingredientCost ?? monthlyRevenue * 0.34) +
    (payload.financials.utilitiesCost ?? monthlyRevenue * 0.04);
  const costRatio = monthlyRevenue > 0 ? costTotal / monthlyRevenue : 0;
  const aov = payload.profile.averageSpendPerCustomer ?? profile.averageTicket;
  const dailyCustomers = payload.profile.dailyCustomerCount ?? Math.max(1, Math.round(monthlyRevenue / 30 / aov));
  const consulting = buildConsultingNotes(payload, locations[0], analysis.revenueTrend, grossMargin);
  const revenueScore = clamp(58 + analysis.revenueTrend * 180);
  const costScore = clamp(100 - costRatio * 72);
  const growthScore = clamp(readiness.score);
  const overall = Math.round(revenueScore * 0.3 + costScore * 0.32 + growthScore * 0.38);

  return {
    mode: payload.mode === "real" ? "real" : "template",
    generatedAt: new Date().toISOString(),
    inputSummary: `${payload.profile.businessName} is a ${payload.profile.businessSize.toLowerCase()} ${payload.profile.businessType.toLowerCase()} in ${payload.profile.city}, ${payload.profile.area}, targeting ${payload.profile.customerSegments}.`,
    executiveSummary:
      overall >= 75
        ? "Your business is expansion-ready but should tighten menu complexity and off-peak economics before signing a second lease."
        : "Your business is promising but should stabilize profitability and demand generation before aggressive expansion.",
    businessHealthScore: {
      overall,
      revenue: Math.round(revenueScore),
      costEfficiency: Math.round(costScore),
      growthPotential: Math.round(growthScore)
    },
    financialKpis: {
      totalRevenue: analysis.totalRevenue,
      revenuePerDay: analysis.dailySeries.length ? analysis.totalRevenue / analysis.dailySeries.length : monthlyRevenue / 30,
      revenuePerHour: analysis.hourlySeries.length ? analysis.totalRevenue / analysis.hourlySeries.length : monthlyRevenue / 240,
      revenueGrowthRate: analysis.revenueTrend,
      netProfit,
      grossMargin,
      costRatio,
      laborCostEfficiency: monthlyRevenue / Math.max(1, payload.profile.employees),
      ingredientCostPerSale: (payload.financials.ingredientCost ?? monthlyRevenue * 0.34) / Math.max(1, dailyCustomers * 30),
      profitPerCustomer: netProfit / Math.max(1, dailyCustomers * 30)
    },
    operationalKpis: {
      peakHourEfficiency: `${analysis.peakHour}:00 drives the strongest demand and should anchor staffing, prep, and delivery capacity.`,
      staffUtilizationRate: clamp((dailyCustomers / Math.max(1, payload.profile.employees * 11)) * 100),
      tableTurnoverRate: payload.profile.seatingCapacity ? dailyCustomers / payload.profile.seatingCapacity : 2.4,
      inventoryTurnoverRate: clamp(100 - (payload.financials.wasteRate ?? 4.8) * 8)
    },
    productPerformance: {
      topByRevenue: analysis.bestProducts.slice(0, 10),
      topByProfit: byProfit(analysis.bestProducts).slice(0, 10),
      lowMarginProducts: lowMargin(analysis.worstProducts).slice(0, 5),
      contributionNotes: [
        `${analysis.bestProducts[0]?.name ?? "The top item"} should be used as the hero product in launch campaigns.`,
        "Bottom low-margin items should be removed, repriced, or bundled.",
        "Menu contribution should be reviewed weekly during the first 90 days."
      ]
    },
    customerAnalytics: {
      averageOrderValue: aov,
      customerFrequency: `${payload.profile.repeatCustomerRate ?? 30}% repeat-customer signal, based on owner input or AI estimate.`,
      peakSegments: payload.profile.customerSegments.split(",").map((segment) => segment.trim()).filter(Boolean).slice(0, 4),
      estimatedLifetimeValue: Math.round(aov * 7.5)
    },
    consultingAnalysis: {
      trendAnalysis: consulting.trend,
      bottleneckAnalysis: consulting.bottlenecks,
      profitLeakageAnalysis: consulting.leakage,
      benchmarking: consulting.benchmarking,
      scenarioSimulation: consulting.scenarios
    },
    keyInsights: [
      "Lunch pricing is under-optimized relative to peak demand.",
      "A small number of products generate the majority of profit.",
      "Off-peak hours are the clearest capacity opportunity.",
      "Expansion should be staged around manager readiness and rent discipline."
    ],
    problemDiagnosis: [
      "Low off-peak utilization reduces overall profitability.",
      "Menu complexity creates operational drag during peak hours.",
      "Marketing does not yet fully capture repeat customer behavior."
    ],
    recommendations: {
      quickWins: [
        "Increase lunch price by 8-12% on high-demand items.",
        "Remove or bundle the bottom 20% low-margin items.",
        "Add a weekday off-peak combo to fill idle capacity."
      ],
      operationalImprovements: [
        "Optimize staff scheduling based on peak-hour revenue.",
        "Reduce menu complexity by 15-20%.",
        "Track waste and overstock by product family each week."
      ],
      strategicMoves: [
        "Introduce combo pricing for office workers and family groups.",
        "Launch a loyalty program before opening a second store.",
        `Prioritize ${locations[0]?.district ?? "a lower-rent, high-fit district"} as the second-store pilot zone.`
      ]
    },
    marketingStrategy,
    expansionAnalysis: {
      expansionReadinessScore: readiness.score,
      recommendedZones: locations.slice(0, 4),
      riskLevel: readiness.riskLevel,
      breakEvenEstimation: locations[0]
        ? `${locations[0].district} estimated payback: ${locations[0].paybackMonths} months under demo assumptions.`
        : "Break-even requires location data."
    },
    financialImpactSimulation: {
      expectedRevenueIncrease: 0.12,
      expectedCostReduction: 0.07,
      expectedProfitIncrease: 0.18,
      roiEstimation: "Expected positive ROI within 9-14 months if rent and launch CAC stay within target range."
    },
    actionPlanRoadmap: {
      now: ["Apply quick pricing fixes.", "Identify low-margin items.", "Confirm top two launch districts."],
      next30Days: ["Run menu optimization.", "Build waitlist campaign.", "Train branch manager candidate."],
      next3Months: ["Launch CRM and loyalty system.", "Negotiate lease terms.", "Run supplier capacity check."],
      next12Months: ["Open second-store pilot.", "Monitor payback and reviews.", "Create franchise-ready operating playbook."]
    },
    designBrief,
    charts: {
      dailySeries: analysis.dailySeries,
      hourlySeries: analysis.hourlySeries,
      categoryMix: analysis.categoryMix,
      channelMix: analysis.channelMix
    },
    disclaimer:
      "Demo-level AI business analysis only. Real lease, legal, accounting, licensing, and investment decisions require professional review."
  };
}

export function normalizeFinalReport(value: Partial<FinalConsultantReport>, fallback: FinalConsultantReport): FinalConsultantReport {
  return {
    ...fallback,
    ...value,
    mode: value.mode ?? fallback.mode,
    businessHealthScore: { ...fallback.businessHealthScore, ...value.businessHealthScore },
    financialKpis: { ...fallback.financialKpis, ...value.financialKpis },
    operationalKpis: { ...fallback.operationalKpis, ...value.operationalKpis },
    productPerformance: { ...fallback.productPerformance, ...value.productPerformance },
    customerAnalytics: { ...fallback.customerAnalytics, ...value.customerAnalytics },
    consultingAnalysis: { ...fallback.consultingAnalysis, ...value.consultingAnalysis },
    recommendations: { ...fallback.recommendations, ...value.recommendations },
    marketingStrategy: { ...fallback.marketingStrategy, ...value.marketingStrategy },
    expansionAnalysis: { ...fallback.expansionAnalysis, ...value.expansionAnalysis },
    financialImpactSimulation: { ...fallback.financialImpactSimulation, ...value.financialImpactSimulation },
    actionPlanRoadmap: { ...fallback.actionPlanRoadmap, ...value.actionPlanRoadmap },
    designBrief: { ...fallback.designBrief, ...value.designBrief },
    charts: { ...fallback.charts, ...value.charts }
  };
}
