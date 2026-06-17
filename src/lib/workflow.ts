import type { AiConfig, AnalysisPayload, FinancialInput, GoalOption, IntakeProfile } from "./types";

export const payloadStorageKey = "branchwise:analysis-payload";
export const reportStorageKey = "branchwise:analysis-report";

export const goalOptions: GoalOption[] = [
  "Increase revenue",
  "Reduce cost",
  "Expand business",
  "Improve marketing",
  "Optimize menu/products",
  "Branding/interior design"
];

export const defaultAiConfig: AiConfig = {
  provider: "OpenCode Zen",
  baseUrl: "https://opencode.ai/zen/go/v1/chat/completions",
  model: "deepseek-v4-flash",
  apiKey: ""
};

export const defaultIntakeProfile: IntakeProfile = {
  businessName: "",
  businessType: "Restaurant",
  businessSize: "Single store",
  city: "Hong Kong",
  area: "",
  employees: 0,
  openingHours: "11:00-22:00",
  businessModel: "Hybrid",
  seatingCapacity: undefined,
  peakHours: "",
  offPeakHours: "",
  dailyCustomerCount: undefined,
  repeatCustomerRate: undefined,
  averageSpendPerCustomer: undefined,
  customerSegments: "",
  marketingChannels: "",
  goals: []
};

export const defaultFinancials: FinancialInput = {
  monthlyRevenue: undefined,
  dailyRevenue: undefined,
  morningRevenue: undefined,
  lunchRevenue: undefined,
  dinnerRevenue: undefined,
  rentCost: undefined,
  laborCost: undefined,
  ingredientCost: undefined,
  utilitiesCost: undefined,
  netProfit: undefined,
  grossMargin: undefined,
  wasteRate: undefined,
  overstockIssues: ""
};

export function createDefaultPayload(): AnalysisPayload {
  return {
    mode: "real",
    profile: defaultIntakeProfile,
    financials: defaultFinancials,
    salesRecords: [],
    uploadedSources: [],
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
