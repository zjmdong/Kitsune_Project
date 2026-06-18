import { createSampleSalesRecords, sampleProfile } from "./sample-data";
import { generateSimulatedReport } from "./simulation";
import { defaultAiConfig } from "./workflow";
import type { AnalysisPayload, LoadingStep } from "./types";

export const localMoodboardPath = "/kitsune-moodboard.png";
export const localMoodboardFilePath = "C:/Users/zjmdong/Documents/HKU_AI-in-Business/public/kitsune-moodboard.png";

export type KITSUNESampleTemplate = {
  templateName: string;
  version: 1;
  payload: AnalysisPayload;
  loadingScript?: LoadingStep[];
};

export const sampleLoadingScript: LoadingStep[] = [
  {
    progress: 8,
    stage: "Reading uploaded sales evidence",
    thought: "I found 84 days of transaction-level sales records and mapped revenue, cost, products, hours, and channels.",
    durationMs: 700
  },
  {
    progress: 22,
    stage: "Reconstructing business profile",
    thought: "The store behaves like a premium single-location Thai restaurant with strong lunch and dinner demand.",
    durationMs: 850
  },
  {
    progress: 39,
    stage: "Computing financial and operational KPIs",
    thought: "Gross margin is healthy, but rent, payroll, and off-peak utilization create pressure on operating buffer.",
    durationMs: 900
  },
  {
    progress: 57,
    stage: "Diagnosing bottlenecks and profit leakage",
    thought: "The main constraint is not demand. It is menu complexity, off-peak labor deployment, and weak repeat-customer capture.",
    durationMs: 1000
  },
  {
    progress: 74,
    stage: "Scoring expansion readiness",
    thought: "The store can test a second branch if the team uses a staged lease decision and protects payback discipline.",
    durationMs: 900
  },
  {
    progress: 88,
    stage: "Building the marketing and location plan",
    thought: "Kwun Tong and Sha Tin are stronger pilot zones than high-rent flagship districts for this second-store stage.",
    durationMs: 850
  },
  {
    progress: 100,
    stage: "Finalizing consultant report",
    thought: "I am assembling the executive summary, KPI tables, action roadmap, expansion analysis, and PDF-ready report.",
    durationMs: 700
  }
];

export function createSampleTemplate(): KITSUNESampleTemplate {
  const salesRecords = createSampleSalesRecords();
  const payload: AnalysisPayload = {
    mode: "real",
    profile: {
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
      goals: ["Expand business", "Increase revenue", "Improve marketing", "Branding/interior design"]
    },
    financials: {
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
    },
    salesRecords,
    uploadedSources: [
      {
        kind: "sales",
        name: "kitsune-sample-sales.csv",
        rowCount: salesRecords.length,
        notes: "Sample sales records for fast input during a live walkthrough."
      },
      {
        kind: "inventory",
        name: "kitsune-sample-inventory-summary.xlsx",
        notes: "Sample context: weekday starter overstock and dessert waste signals."
      },
      {
        kind: "marketing",
        name: "kitsune-sample-marketing-notes.pdf",
        notes: "Sample context: Instagram/TikTok/offline traffic mix and launch campaign ideas."
      }
    ],
    aiConfig: defaultAiConfig
  };

  return {
    templateName: "KITSUNE fast input sample package",
    version: 1,
    payload
  };
}

export function createPresetSampleTemplate(): KITSUNESampleTemplate {
  const fastInputTemplate = createSampleTemplate();
  const presetPayload: AnalysisPayload = {
    ...fastInputTemplate.payload,
    mode: "template",
    loadingScript: sampleLoadingScript
  };
  const report = generateSimulatedReport(presetPayload);
  report.designBrief.imagePath = localMoodboardPath;

  return {
    templateName: "KITSUNE preset report sample package",
    version: 1,
    payload: {
      ...presetPayload,
      templateReport: report,
      templateAssets: {
        designBriefImagePath: localMoodboardPath,
        designBriefLocalPath: localMoodboardFilePath
      }
    },
    loadingScript: sampleLoadingScript
  };
}

export function isKITSUNESampleTemplate(value: unknown): value is KITSUNESampleTemplate {
  const candidate = value as Partial<KITSUNESampleTemplate> | undefined;
  return Boolean(
    candidate &&
      candidate.version === 1 &&
      candidate.payload?.profile?.businessName &&
      Array.isArray(candidate.payload.salesRecords)
  );
}
