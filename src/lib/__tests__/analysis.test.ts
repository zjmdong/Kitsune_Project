import { describe, expect, it } from "vitest";
import { analyzeBusiness, calculateReadiness, rankLocations } from "../analysis";
import { districtMetrics, sampleProfile, createSampleSalesRecords } from "../sample-data";
import { parseSalesCsv } from "../csv";
import { generateSimulatedReport, normalizeFinalReport } from "../simulation";
import type { AnalysisPayload } from "../types";

describe("business analysis", () => {
  it("calculates KPI output from sample sales records", () => {
    const analysis = analyzeBusiness(createSampleSalesRecords(), sampleProfile);

    expect(analysis.totalRevenue).toBeGreaterThan(0);
    expect(analysis.grossMargin).toBeGreaterThan(0.55);
    expect(analysis.bestProducts.length).toBe(5);
    expect(analysis.dailySeries.length).toBeGreaterThan(70);
  });

  it("scores readiness within a bounded range", () => {
    const analysis = analyzeBusiness(createSampleSalesRecords(), sampleProfile);
    const readiness = calculateReadiness(analysis, sampleProfile);

    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(readiness.factors.length).toBe(6);
  });

  it("ranks locations with the strongest score first", () => {
    const analysis = analyzeBusiness(createSampleSalesRecords(), sampleProfile);
    const locations = rankLocations(districtMetrics, sampleProfile, analysis);

    expect(locations.length).toBe(districtMetrics.length);
    expect(locations[0].score).toBeGreaterThanOrEqual(locations[1].score);
    expect(locations[0].estimatedMonthlyRent).toBeGreaterThan(0);
  });

  it("parses uploaded CSV records", () => {
    const rows = [
      "date,hour,product,category,units,revenue,cost,channel",
      "2026-05-01,12,Green Curry Set,Signature Mains,18,2880,1044,Dine-in"
    ].join("\n");

    const parsed = parseSalesCsv(rows);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].revenue).toBe(2880);
    expect(parsed[0].channel).toBe("Dine-in");
  });

  it("uses local currency and districts for a Las Vegas payload", () => {
    const payload: AnalysisPayload = {
      mode: "real",
      profile: {
        businessName: "Gong Cha Las Vegas - Chinatown",
        businessType: "Restaurant / Bubble Tea Shop",
        businessSize: "Single store",
        city: "Las Vegas, Nevada, USA",
        area: "Chinatown / Spring Valley",
        employees: 9,
        openingHours: "11:00-22:00",
        businessModel: "Hybrid",
        seatingCapacity: 24,
        peakHours: "13:00-19:00",
        offPeakHours: "11:00-13:00; 20:30-22:00",
        dailyCustomerCount: 217,
        repeatCustomerRate: 42,
        averageSpendPerCustomer: 9.25,
        customerSegments: "Local Asian-American residents, students, tourists",
        marketingChannels: "Instagram, TikTok, Google Maps, Uber Eats",
        goals: ["Increase revenue", "Reduce cost", "Improve marketing"]
      },
      financials: {
        monthlyRevenue: 62317.35,
        dailyRevenue: 2010.24,
        rentCost: 4650,
        laborCost: 20200,
        ingredientCost: 16427.6,
        utilitiesCost: 1850,
        netProfit: 8603.81,
        grossMargin: 73.64,
        wasteRate: 3.1
      },
      salesRecords: [
        { date: "2026-03-01", hour: 13, product: "Brown Sugar Milk Tea", category: "Milk Tea", units: 10, revenue: 92.5, cost: 24.4, channel: "Takeaway" },
        { date: "2026-03-02", hour: 14, product: "Mango Smoothie", category: "Smoothie", units: 8, revenue: 74, cost: 19.5, channel: "Dine-in" },
        { date: "2026-03-03", hour: 18, product: "Black Milk Tea", category: "Milk Tea", units: 11, revenue: 101.75, cost: 26.8, channel: "Delivery" },
        { date: "2026-03-04", hour: 16, product: "Taro Milk Tea", category: "Milk Tea", units: 9, revenue: 83.25, cost: 22, channel: "Takeaway" },
        { date: "2026-03-05", hour: 19, product: "QQ Passionfruit Green Tea", category: "Fruit Drink", units: 7, revenue: 64.75, cost: 17.1, channel: "Dine-in" },
        { date: "2026-03-16", hour: 15, product: "Brown Sugar Milk Tea", category: "Milk Tea", units: 12, revenue: 111, cost: 29.3, channel: "Takeaway" },
        { date: "2026-03-17", hour: 14, product: "Mango Smoothie", category: "Smoothie", units: 9, revenue: 83.25, cost: 22, channel: "Dine-in" },
        { date: "2026-03-18", hour: 18, product: "Black Milk Tea", category: "Milk Tea", units: 13, revenue: 120.25, cost: 31.7, channel: "Delivery" },
        { date: "2026-03-19", hour: 16, product: "Taro Milk Tea", category: "Milk Tea", units: 10, revenue: 92.5, cost: 24.4, channel: "Takeaway" },
        { date: "2026-03-20", hour: 19, product: "QQ Passionfruit Green Tea", category: "Fruit Drink", units: 8, revenue: 74, cost: 19.5, channel: "Dine-in" },
        { date: "2026-03-21", hour: 14, product: "Mango Smoothie", category: "Smoothie", units: 9, revenue: 83.25, cost: 22, channel: "Dine-in" },
        { date: "2026-03-22", hour: 18, product: "Black Milk Tea", category: "Milk Tea", units: 13, revenue: 120.25, cost: 31.7, channel: "Delivery" },
        { date: "2026-03-23", hour: 16, product: "Taro Milk Tea", category: "Milk Tea", units: 10, revenue: 92.5, cost: 24.4, channel: "Takeaway" },
        { date: "2026-03-24", hour: 19, product: "QQ Passionfruit Green Tea", category: "Fruit Drink", units: 8, revenue: 74, cost: 19.5, channel: "Dine-in" }
      ],
      uploadedSources: []
    };

    const report = generateSimulatedReport(payload);

    expect(report.currencyCode).toBe("USD");
    expect(report.customerAnalytics.averageOrderValue).toBe(9.25);
    expect(report.expansionAnalysis.recommendedZones[0].district).not.toBe("Kwun Tong");
    expect(report.expansionAnalysis.recommendedZones.map((zone) => zone.district)).toContain("Chinatown / Spring Valley");
  });

  it("preserves model-selected top priority highlights when they match report items", () => {
    const fallback = generateSimulatedReport({
      mode: "real",
      profile: {
        businessName: "Gong Cha Las Vegas - Chinatown",
        businessType: "Restaurant / Bubble Tea Shop",
        businessSize: "Single store",
        city: "Las Vegas, Nevada, USA",
        area: "Chinatown / Spring Valley",
        employees: 9,
        openingHours: "11:00-22:00",
        businessModel: "Hybrid",
        seatingCapacity: 24,
        peakHours: "13:00-19:00",
        offPeakHours: "11:00-13:00; 20:30-22:00",
        dailyCustomerCount: 217,
        repeatCustomerRate: 42,
        averageSpendPerCustomer: 9.25,
        customerSegments: "Local Asian-American residents, students, tourists",
        marketingChannels: "Instagram, TikTok, Google Maps, Uber Eats",
        goals: ["Increase revenue", "Reduce cost", "Improve marketing"]
      },
      financials: {
        monthlyRevenue: 62317.35,
        dailyRevenue: 2010.24,
        rentCost: 4650,
        laborCost: 20200,
        ingredientCost: 16427.6,
        utilitiesCost: 1850,
        netProfit: 8603.81,
        grossMargin: 73.64,
        wasteRate: 3.1
      },
      salesRecords: createSampleSalesRecords(),
      uploadedSources: []
    });
    const modelSelectedItem = fallback.consultingAnalysis.benchmarking[0];

    const normalized = normalizeFinalReport(
      {
        priorityHighlights: {
          profitLeakageBenchmarking: {
            item: modelSelectedItem,
            reason: "LLM selected this as the highest upside benchmark gap."
          }
        }
      },
      fallback
    );

    expect(normalized.priorityHighlights?.profitLeakageBenchmarking?.item).toBe(modelSelectedItem);
    expect(normalized.priorityHighlights?.profitLeakageBenchmarking?.reason).toContain("LLM selected");
  });
});
