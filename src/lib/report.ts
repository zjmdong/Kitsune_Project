import type {
  AnalysisResult,
  BusinessProfile,
  ConsultantReport,
  DesignBrief,
  LocationRecommendation,
  MarketingPlan
} from "./types";
import { formatCurrency, formatPercent } from "./format";

export function createMarketingPlan(
  profile: BusinessProfile,
  analysis: AnalysisResult,
  locations: LocationRecommendation[]
): MarketingPlan {
  const topLocation = locations[0]?.district ?? "the target district";
  const heroProduct = analysis.bestProducts[0]?.name ?? "signature menu";
  const peakHour = analysis.peakHour ? `${analysis.peakHour}:00` : "lunch and dinner";

  return {
    positioning: `${profile.businessName} should be positioned as a polished ${profile.cuisineOrProduct.toLowerCase()} brand for ${profile.targetCustomer.toLowerCase()}, with ${topLocation} as the highest-priority second-store test market.`,
    socialPosts: [
      `Behind the wok: show the team preparing ${heroProduct} during the ${peakHour} rush.`,
      `District teaser: ask followers where the next ${profile.businessName} should open, then reveal the ${topLocation} shortlist.`,
      "Founder story: explain the brand promise, sourcing, and service standards in one short video."
    ],
    campaigns: [
      "Second-store waitlist with a limited tasting menu invite.",
      "Weekday lunch bundle for office workers, calibrated to protect gross margin.",
      "Dinner group offer for tables of four, focused on signature mains and beverages."
    ],
    loyaltyProgram:
      "Launch a simple points program: 1 point per HKD 10, double points at the new branch during the first 30 days, and one chef tasting reward after three visits.",
    seasonalCalendar: [
      "Month 1: soft-opening tasting nights and district partner previews.",
      "Month 2: Thai festival menu, creator visits, and office lunch sampling.",
      "Month 3: membership push, corporate catering bundles, and review-generation campaign."
    ]
  };
}

export function createDesignBrief(profile: BusinessProfile): DesignBrief {
  return {
    palette: [
      { name: "Kitsune Orange", hex: "#ea580c" },
      { name: "Amber Glow", hex: "#f59e0b" },
      { name: "Cedar Brown", hex: "#7c2d12" },
      { name: "Warm Ivory", hex: "#fff7ed" },
      { name: "Charcoal Ink", hex: "#24130a" }
    ],
    interiorStyle:
      "Compact premium dining: warm amber lighting, textured ivory walls, cedar accents, efficient two-seat tables, and one camera-ready signature wall.",
    moodboardPrompt:
      "A refined Hong Kong restaurant interior with amber lighting, cedar details, warm ivory walls, compact street-front seating, and a premium but welcoming mood.",
    storefrontNotes: [
      "Use a narrower menu board outside the entrance to keep the frontage clean.",
      "Place the hero dish visual near the pickup zone for delivery and takeaway conversion.",
      "Keep the signature wall visible from the street so the store is recognizable in social content."
    ]
  };
}

export function createMockConsultantReport(
  profile: BusinessProfile,
  analysis: AnalysisResult,
  locations: LocationRecommendation[]
): ConsultantReport {
  const topLocation = locations[0];
  const secondLocation = locations[1];
  const marketingPlan = createMarketingPlan(profile, analysis, locations);
  const designBrief = createDesignBrief(profile);

  return {
    mode: "mock",
    diagnosis: `${profile.businessName} has a credible second-store case: revenue is trending ${formatPercent(
      analysis.revenueTrend
    )}, gross margin is ${formatPercent(analysis.grossMargin)}, and estimated monthly operating profit is ${formatCurrency(
      analysis.estimatedMonthlyProfit
    )}. Expansion should proceed only with a staged lease decision and a manager-training plan.`,
    keyInsights: [
      `${analysis.bestProducts[0]?.name ?? "The top product"} is the clearest hero item and should anchor ads, tasting menus, and launch bundles.`,
      `${analysis.peakHour}:00 is the strongest demand window, so staffing and prep should be protected before opening a second branch.`,
      `${topLocation?.district ?? "The top district"} ranks highest because it balances target-customer fit, traffic, and rent affordability.`,
      analysis.operatingRisks[0] ?? "No severe operating risk was detected in the supplied dataset."
    ],
    recommendations: [
      `Negotiate only locations that keep monthly rent below ${formatCurrency(
        topLocation?.estimatedMonthlyRent ?? profile.monthlyRent * 1.1
      )} or include a rent-free fitting-out period.`,
      `Prioritize ${topLocation?.district ?? "the top district"} first, with ${
        secondLocation?.district ?? "a lower-rent district"
      } as the backup if payback exceeds 18 months.`,
      "Create a branch manager checklist covering service timing, ordering par levels, supplier handoff, and daily close reports.",
      "Run a 30-day pre-launch waitlist campaign before signing final fit-out payments."
    ],
    expectedImpact: [
      "Reduce consultant discovery cost by turning sales data into an expansion brief in minutes.",
      "Improve second-store payback discipline through rent, traffic, and target-fit scoring.",
      "Increase launch conversion by linking hero products, local audience, and district-specific marketing."
    ],
    first90Days: [
      "Days 1-15: validate two shortlisted districts, estimate fit-out cost, and assign a branch leader.",
      "Days 16-45: negotiate lease terms, build launch waitlist, and lock supplier capacity.",
      "Days 46-75: run soft-opening tests, monitor hourly sales, and adjust labor planning.",
      "Days 76-90: review margin, repeat visits, reviews, and payback trend before scaling campaigns."
    ],
    marketingPlan,
    designBrief,
    disclaimer:
      "AI-assisted analysis for planning use only. Real lease, legal, accounting, licensing, and investment decisions require professional review."
  };
}
