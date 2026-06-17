import type { BusinessProfile, DistrictMetric, SalesRecord } from "./types";

export const sampleProfile: BusinessProfile = {
  businessName: "Saffron Bay Thai Kitchen",
  category: "Restaurant",
  currentDistrict: "Wan Chai",
  positioning: "Premium",
  cuisineOrProduct: "Modern Thai dining",
  monthlyRent: 128000,
  staffCount: 16,
  weeklyTransactions: 1080,
  averageTicket: 188,
  expansionBudget: 1450000,
  targetCustomer: "Office workers, young professionals, mall diners, weekend couples",
  ownerGoal: "Open a second Hong Kong location within 9 months without hurting the flagship store."
};

const products = [
  { product: "Tom Yum Lobster Bowl", category: "Signature Mains", price: 238, costRate: 0.36, weight: 0.15 },
  { product: "Green Curry Set", category: "Signature Mains", price: 168, costRate: 0.34, weight: 0.18 },
  { product: "Pad Thai River Prawn", category: "Signature Mains", price: 188, costRate: 0.32, weight: 0.16 },
  { product: "Mango Sticky Rice", category: "Dessert", price: 78, costRate: 0.28, weight: 0.12 },
  { product: "Thai Milk Tea", category: "Beverage", price: 48, costRate: 0.22, weight: 0.18 },
  { product: "Lemongrass Chicken Skewers", category: "Starter", price: 98, costRate: 0.31, weight: 0.11 },
  { product: "Corporate Lunch Box", category: "Catering", price: 128, costRate: 0.38, weight: 0.1 }
];

const hourWeights: Record<number, number> = {
  11: 0.7,
  12: 1.6,
  13: 1.45,
  14: 0.55,
  18: 1.2,
  19: 1.65,
  20: 1.35,
  21: 0.75
};

const channels: SalesRecord["channel"][] = ["Dine-in", "Takeaway", "Delivery", "Catering"];

export function createSampleSalesRecords(): SalesRecord[] {
  const records: SalesRecord[] = [];
  const start = new Date("2026-03-01T00:00:00");

  for (let day = 0; day < 84; day += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + day);
    const iso = date.toISOString().slice(0, 10);
    const weekday = date.getDay();
    const weekendLift = weekday === 0 || weekday === 6 ? 1.22 : 1;
    const trendLift = 1 + day * 0.0024;
    const eventLift = day > 52 && day < 64 ? 1.16 : 1;

    Object.entries(hourWeights).forEach(([hourText, hourWeight]) => {
      products.forEach((item, productIndex) => {
        const hour = Number(hourText);
        const wave = 1 + Math.sin((day + productIndex * 3 + hour) / 6) * 0.12;
        const baseline = 12 * item.weight * hourWeight * weekendLift * trendLift * eventLift * wave;
        const units = Math.max(1, Math.round(baseline + ((day + productIndex + hour) % 3)));
        const revenue = Math.round(units * item.price);
        const cost = Math.round(revenue * item.costRate);
        const channel =
          item.category === "Catering"
            ? "Catering"
            : channels[(day + productIndex + hour) % (channels.length - 1)];

        records.push({
          date: iso,
          hour,
          product: item.product,
          category: item.category,
          units,
          revenue,
          cost,
          channel
        });
      });
    });
  }

  return records;
}

export const districtMetrics: DistrictMetric[] = [
  {
    district: "Causeway Bay",
    rentIndex: 92,
    footfallIndex: 96,
    competitionIndex: 86,
    targetFitIndex: 91,
    transitIndex: 95,
    audience: "Retail shoppers, office workers, tourists",
    notes: "High visibility and strong dinner traffic, but premium rents require disciplined store sizing."
  },
  {
    district: "Tsim Sha Tsui",
    rentIndex: 88,
    footfallIndex: 94,
    competitionIndex: 82,
    targetFitIndex: 88,
    transitIndex: 93,
    audience: "Tourists, hotel guests, office workers, weekend groups",
    notes: "Good match for a polished Thai concept with strong evening and visitor demand."
  },
  {
    district: "Central",
    rentIndex: 98,
    footfallIndex: 91,
    competitionIndex: 78,
    targetFitIndex: 84,
    transitIndex: 96,
    audience: "Finance professionals, premium lunch and after-work diners",
    notes: "Brand enhancing location, but lunch economics and staffing costs need close control."
  },
  {
    district: "Kwun Tong",
    rentIndex: 58,
    footfallIndex: 74,
    competitionIndex: 63,
    targetFitIndex: 80,
    transitIndex: 82,
    audience: "Office clusters, value-conscious professionals, weekday lunch groups",
    notes: "Lower rent improves payback, with strong lunch demand and room for delivery operations."
  },
  {
    district: "Sha Tin",
    rentIndex: 64,
    footfallIndex: 79,
    competitionIndex: 58,
    targetFitIndex: 76,
    transitIndex: 78,
    audience: "Families, mall diners, residential repeat customers",
    notes: "Balanced second-store market with lower competitive pressure and family dining demand."
  },
  {
    district: "Tseung Kwan O",
    rentIndex: 61,
    footfallIndex: 76,
    competitionIndex: 55,
    targetFitIndex: 74,
    transitIndex: 80,
    audience: "Young families, residential diners, delivery customers",
    notes: "Emerging residential market suited to repeat dining and loyalty programs."
  }
];

export const dataSourceLinks = [
  { label: "CSDI Portal", url: "https://portal.csdi.gov.hk/" },
  { label: "DATA.GOV.HK", url: "https://data.gov.hk/en/" },
  {
    label: "Rating and Valuation Department",
    url: "https://www.rvd.gov.hk/en/publications/property_market_statistics.html"
  }
];
