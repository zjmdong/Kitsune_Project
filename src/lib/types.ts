export type BusinessProfile = {
  businessName: string;
  category: string;
  currentDistrict: string;
  positioning: "Value" | "Mid-market" | "Premium";
  cuisineOrProduct: string;
  monthlyRent: number;
  staffCount: number;
  weeklyTransactions: number;
  averageTicket: number;
  expansionBudget: number;
  targetCustomer: string;
  ownerGoal: string;
};

export type SalesRecord = {
  date: string;
  hour: number;
  product: string;
  category: string;
  units: number;
  revenue: number;
  cost: number;
  channel: "Dine-in" | "Takeaway" | "Delivery" | "Retail" | "Catering";
};

export type DistrictMetric = {
  district: string;
  rentIndex: number;
  footfallIndex: number;
  competitionIndex: number;
  targetFitIndex: number;
  transitIndex: number;
  audience: string;
  notes: string;
};

export type TimeSeriesPoint = {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type RankedItem = {
  name: string;
  value: number;
  units?: number;
  share?: number;
};

export type AnalysisResult = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  estimatedMonthlyRevenue: number;
  estimatedMonthlyProfit: number;
  revenueTrend: number;
  peakHour: number;
  peakHourRevenue: number;
  bestProducts: RankedItem[];
  worstProducts: RankedItem[];
  categoryMix: RankedItem[];
  channelMix: RankedItem[];
  dailySeries: TimeSeriesPoint[];
  hourlySeries: { hour: string; revenue: number }[];
  operatingRisks: string[];
};

export type ReadinessScore = {
  score: number;
  riskLevel: "Low" | "Medium" | "High";
  verdict: string;
  factors: {
    label: string;
    score: number;
    max: number;
    note: string;
  }[];
};

export type LocationRecommendation = {
  district: string;
  score: number;
  estimatedMonthlyRent: number;
  paybackMonths: number;
  fit: string;
  risks: string[];
  reasons: string[];
  metrics: DistrictMetric;
};

export type MarketingPlan = {
  positioning: string;
  socialPosts: string[];
  campaigns: string[];
  loyaltyProgram: string;
  seasonalCalendar: string[];
};

export type DesignBrief = {
  palette: { name: string; hex: string }[];
  interiorStyle: string;
  moodboardPrompt: string;
  storefrontNotes: string[];
};

export type ConsultantReport = {
  mode: "mock" | "live";
  diagnosis: string;
  keyInsights: string[];
  recommendations: string[];
  expectedImpact: string[];
  first90Days: string[];
  marketingPlan: MarketingPlan;
  designBrief: DesignBrief;
  disclaimer: string;
};
