import { createSampleSalesRecords, sampleProfile } from "./sample-data";
import { defaultAiConfig } from "./workflow";
import type { AnalysisPayload } from "./types";

export type KITSUNESampleTemplate = {
  templateName: string;
  version: 1;
  payload: AnalysisPayload;
};

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

export function isKITSUNESampleTemplate(value: unknown): value is KITSUNESampleTemplate {
  const candidate = value as Partial<KITSUNESampleTemplate> | undefined;
  return Boolean(
    candidate &&
      candidate.version === 1 &&
      candidate.payload?.profile?.businessName &&
      Array.isArray(candidate.payload.salesRecords)
  );
}
