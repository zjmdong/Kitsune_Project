import type { AiConfig, AnalysisPayload, FinancialInput, GoalOption, IntakeProfile } from "./types";
import { createSampleSalesRecords, sampleProfile } from "./sample-data";

export const payloadStorageKey = "branchwise:analysis-payload";
export const reportStorageKey = "branchwise:analysis-report";

export const goalOptions: GoalOption[] = [
  "Increase revenue",
  "Reduce cost",
  "Expand business",
  "Improve marketing",
  "Optimize menu/products"
];

export const defaultAiConfig: AiConfig = {
  provider: "OpenAI-compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKey: ""
};

export const defaultIntakeProfile: IntakeProfile = {
  businessName: sampleProfile.businessName,
  businessType: "Restaurant",
  businessSize: "Single store",
  city: "Hong Kong",
  area: sampleProfile.currentDistrict,
  employees: sampleProfile.staffCount,
  openingHours: "11:00-22:00",
  businessModel: "Hybrid",
  seatingCapacity: 58,
  peakHours: "12:00-14:00, 19:00-21:00",
  offPeakHours: "15:00-17:30",
  dailyCustomerCount: 155,
  repeatCustomerRate: 34,
  averageSpendPerCustomer: sampleProfile.averageTicket,
  customerSegments: sampleProfile.targetCustomer,
  marketingChannels: "Instagram, TikTok, Google Maps, office lunch traffic",
  goals: ["Expand business", "Increase revenue", "Improve marketing"]
};

export const defaultFinancials: FinancialInput = {
  monthlyRevenue: 780000,
  dailyRevenue: 26000,
  morningRevenue: 72000,
  lunchRevenue: 325000,
  dinnerRevenue: 383000,
  rentCost: sampleProfile.monthlyRent,
  laborCost: 272000,
  ingredientCost: 260000,
  utilitiesCost: 28000,
  netProfit: 61000,
  grossMargin: 66.9,
  wasteRate: 4.8,
  overstockIssues: "Some low-volume starters and desserts are overstocked on weekdays."
};

export function createDefaultPayload(): AnalysisPayload {
  return {
    mode: "simulation",
    profile: defaultIntakeProfile,
    financials: defaultFinancials,
    salesRecords: createSampleSalesRecords(),
    uploadedSources: [
      {
        kind: "sales",
        name: "branchwise-sample-sales.csv",
        rowCount: createSampleSalesRecords().length,
        notes: "Demo sales dataset for a Hong Kong premium Thai restaurant."
      }
    ],
    aiConfig: defaultAiConfig
  };
}

export function isPayload(value: unknown): value is AnalysisPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AnalysisPayload>;
  return Boolean(candidate.profile?.businessName && candidate.profile?.businessType && candidate.financials);
}
