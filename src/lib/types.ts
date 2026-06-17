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

export type AnalysisMode = "real" | "template";

export type GoalOption =
  | "Increase revenue"
  | "Reduce cost"
  | "Expand business"
  | "Improve marketing"
  | "Optimize menu/products";

export type AiConfig = {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
};

export type IntakeProfile = {
  businessName: string;
  businessType: string;
  businessSize: "Single store" | "Small chain" | "Chain";
  city: string;
  area: string;
  employees: number;
  openingHours: string;
  businessModel: "Dine-in" | "Takeaway" | "Hybrid" | "Retail";
  seatingCapacity?: number;
  peakHours: string;
  offPeakHours: string;
  dailyCustomerCount?: number;
  repeatCustomerRate?: number;
  averageSpendPerCustomer?: number;
  customerSegments: string;
  marketingChannels: string;
  goals: GoalOption[];
};

export type FinancialInput = {
  dailyRevenue?: number;
  monthlyRevenue?: number;
  morningRevenue?: number;
  lunchRevenue?: number;
  dinnerRevenue?: number;
  rentCost?: number;
  laborCost?: number;
  ingredientCost?: number;
  utilitiesCost?: number;
  netProfit?: number;
  grossMargin?: number;
  wasteRate?: number;
  overstockIssues?: string;
};

export type UploadedSource = {
  kind: "sales" | "product" | "cost" | "inventory" | "marketing" | "other";
  name: string;
  rowCount?: number;
  notes?: string;
};

export type AnalysisPayload = {
  mode: AnalysisMode;
  profile: IntakeProfile;
  financials: FinancialInput;
  salesRecords: SalesRecord[];
  uploadedSources: UploadedSource[];
  aiConfig?: AiConfig;
  templateReport?: FinalConsultantReport;
  loadingScript?: LoadingStep[];
};

export type LoadingStep = {
  progress: number;
  stage: string;
  thought: string;
  durationMs?: number;
};

export type ScoreBreakdown = {
  overall: number;
  revenue: number;
  costEfficiency: number;
  growthPotential: number;
};

export type FinalConsultantReport = {
  mode: AnalysisMode;
  generatedAt: string;
  inputSummary: string;
  executiveSummary: string;
  businessHealthScore: ScoreBreakdown;
  financialKpis: {
    totalRevenue: number;
    revenuePerDay: number;
    revenuePerHour: number;
    revenueGrowthRate: number;
    netProfit: number;
    grossMargin: number;
    costRatio: number;
    laborCostEfficiency: number;
    ingredientCostPerSale: number;
    profitPerCustomer: number;
  };
  operationalKpis: {
    peakHourEfficiency: string;
    staffUtilizationRate: number;
    tableTurnoverRate: number;
    inventoryTurnoverRate: number;
  };
  productPerformance: {
    topByRevenue: RankedItem[];
    topByProfit: RankedItem[];
    lowMarginProducts: RankedItem[];
    contributionNotes: string[];
  };
  customerAnalytics: {
    averageOrderValue: number;
    customerFrequency: string;
    peakSegments: string[];
    estimatedLifetimeValue: number;
  };
  consultingAnalysis: {
    trendAnalysis: string;
    bottleneckAnalysis: string[];
    profitLeakageAnalysis: string[];
    benchmarking: string[];
    scenarioSimulation: string[];
  };
  keyInsights: string[];
  problemDiagnosis: string[];
  recommendations: {
    quickWins: string[];
    operationalImprovements: string[];
    strategicMoves: string[];
  };
  marketingStrategy: MarketingPlan;
  expansionAnalysis: {
    expansionReadinessScore: number;
    recommendedZones: LocationRecommendation[];
    riskLevel: "Low" | "Medium" | "High";
    breakEvenEstimation: string;
  };
  financialImpactSimulation: {
    expectedRevenueIncrease: number;
    expectedCostReduction: number;
    expectedProfitIncrease: number;
    roiEstimation: string;
  };
  actionPlanRoadmap: {
    now: string[];
    next30Days: string[];
    next3Months: string[];
    next12Months: string[];
  };
  designBrief: DesignBrief;
  charts: {
    dailySeries: TimeSeriesPoint[];
    hourlySeries: { hour: string; revenue: number }[];
    categoryMix: RankedItem[];
    channelMix: RankedItem[];
  };
  disclaimer: string;
};
