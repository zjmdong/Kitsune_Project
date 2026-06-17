import { describe, expect, it } from "vitest";
import { analyzeBusiness, calculateReadiness, rankLocations } from "../analysis";
import { districtMetrics, sampleProfile, createSampleSalesRecords } from "../sample-data";
import { parseSalesCsv } from "../csv";

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
});
