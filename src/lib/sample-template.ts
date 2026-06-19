import { createSampleSalesRecords, sampleProfile } from "./sample-data";
import { generateSimulatedReport } from "./simulation";
import { defaultAiConfig } from "./workflow";
import type { AnalysisPayload, FinalConsultantReport, LoadingStep } from "./types";

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
    progress: 6,
    stage: "Reading uploaded evidence package",
    thought: "Loading transaction rows, owner-entered financials, inventory notes, review signals, lease assumptions, and marketing channel context.",
    durationMs: 2200
  },
  {
    progress: 14,
    stage: "Normalizing sales records",
    thought: "Mapping each row into date, hour, product, category, units, revenue, cost, and channel so KPI charts can be reconstructed consistently.",
    durationMs: 2600
  },
  {
    progress: 24,
    stage: "Computing financial baseline",
    thought: "Reconciling revenue period, gross margin, rent ratio, labor ratio, ingredient cost, net profit, average ticket, and daily customer volume.",
    durationMs: 3300
  },
  {
    progress: 35,
    stage: "Segmenting demand patterns",
    thought: "Separating lunch, dinner, weekend, delivery, catering, and off-peak behavior to identify where capacity is underused.",
    durationMs: 3100
  },
  {
    progress: 47,
    stage: "Diagnosing profit leakage",
    thought: "Checking whether leakage is coming from rent pressure, labor scheduling, low-margin SKUs, waste, delivery commission, or weak retention capture.",
    durationMs: 3400
  },
  {
    progress: 58,
    stage: "Applying strategy frameworks",
    thought: "Building the strategic validation layer: TAM/SAM/SOM, competitor alternatives, SWOT+, TOWS actions, Porter five forces, and business model constraints.",
    durationMs: 4200
  },
  {
    progress: 68,
    stage: "Scoring expansion options",
    thought: "Comparing rent pressure, audience fit, transit access, competition, and payback risk across Hong Kong second-store districts.",
    durationMs: 3600
  },
  {
    progress: 78,
    stage: "Selecting highest-impact priorities",
    thought: "Choosing one top priority per report section based on expected profit uplift, revenue lift, cost reduction, risk control, and payback impact.",
    durationMs: 3300
  },
  {
    progress: 88,
    stage: "Drafting recommendations",
    thought: "Converting the analysis into quick wins, operational improvements, marketing campaigns, a lease decision gate, and a 12-month roadmap.",
    durationMs: 3200
  },
  {
    progress: 96,
    stage: "Validating report structure",
    thought: "Checking that charts, strategic validation, priority highlights, marketing plan, design brief, and PDF export fields are complete.",
    durationMs: 2700
  },
  {
    progress: 100,
    stage: "Opening consultant report",
    thought: "The final report is ready with KPI charts, strategy validation, expansion ranking, brand brief, and action roadmap.",
    durationMs: 1400
  }
];

function enrichPresetReport(report: FinalConsultantReport): FinalConsultantReport {
  return {
    ...report,
    executiveSummary:
      "Saffron Bay Thai Kitchen has enough demand quality to test a second branch, but the highest-return path is to fix lunch pricing, reduce low-margin menu complexity, and use a staged lease gate before committing to a flagship-rent district.",
    keyInsights: [
      "Lunch demand is strong enough to support a controlled 8-12% price architecture test on signature sets.",
      "Delivery and catering are useful growth channels, but commission and prep complexity must be managed before scale.",
      "Hong Kong restaurant demand is improving, yet second-store economics should prioritize payback discipline over brand vanity.",
      "Repeat-customer capture is the largest marketing gap because office and weekend segments are visible but not fully owned in CRM."
    ],
    problemDiagnosis: [
      "The store has demand, but profit buffer is compressed by rent, payroll, and low-volume SKUs.",
      "Off-peak hours and weekday dessert/starter waste reduce store-level productivity.",
      "The brand has social awareness, but loyalty data and segment-specific offers are not mature enough for chain expansion.",
      "A premium district lease could create downside risk if the second store opens before manager readiness and supplier controls are proven."
    ],
    consultingAnalysis: {
      trendAnalysis:
        "The sample period shows healthy demand concentration around lunch and dinner with a mild upward sales trend after campaign weeks. The business is not demand-starved; the main constraint is turning peak traffic into repeatable profit.",
      bottleneckAnalysis: [
        "Manager bandwidth is the operational bottleneck for a second store because the flagship still depends on senior staff during peak service.",
        "Menu breadth creates prep load and weekday waste in starters and desserts.",
        "Delivery growth adds revenue but can dilute contribution margin without tighter bundle and commission controls.",
        "CRM capture is too shallow to forecast repeat traffic for a second district with confidence."
      ],
      profitLeakageAnalysis: [
        "Rent plus labor consumes more than half of monthly revenue, so every second-store lease needs a strict payback gate.",
        "Low-volume starters and desserts create weekday overstock and slow prep throughput.",
        "Delivery orders need menu-specific margin rules because platform commission can erase profit on discount-heavy baskets.",
        "Off-peak labor scheduling does not fully match the 15:00-17:30 demand trough."
      ],
      benchmarking: [
        "Government restaurant receipt data suggests Hong Kong dining demand is recovering, but the business should still model conservative same-store sales.",
        "Non-Chinese restaurant growth supports the concept category, yet competition in premium districts remains high.",
        "The current gross margin is strong for a premium casual concept, but rent ratio is above a comfortable expansion threshold.",
        "Visitor and office-worker demand help dinner and lunch traffic, but residential repeat demand matters more for a lower-risk second store."
      ],
      scenarioSimulation: [
        "A +8% lunch set price test on high-demand items can lift monthly revenue without adding seats or kitchen capacity.",
        "Reducing the bottom 20% low-margin SKUs can improve prep speed, waste control, and service consistency.",
        "A Kwun Tong pilot with lower rent can shorten payback versus a Causeway Bay flagship-style lease.",
        "Capturing 1,000 loyalty members before lease signing can reduce second-store opening-month marketing risk."
      ]
    },
    strategicFrameworks: {
      dataIntegrity: {
        confidenceLevel: "High",
        reliabilityScore: 86,
        evidenceUsed: [
          "84 days of transaction-level sample sales records across dine-in, takeaway, delivery, and catering.",
          "Owner-entered monthly revenue, rent, labor, ingredient, utilities, customer count, repeat rate, and average spend.",
          "Inventory and marketing notes describing weekday overstock, social channels, and office lunch traffic.",
          "Public Hong Kong restaurant receipt and tourism context used only as directional market background."
        ],
        assumptionChecks: [
          "Currency is HKD because the business is located in Hong Kong.",
          "AOV is HK$188 and aligns with premium modern Thai dining positioning.",
          "Rent and labor pressure are the core expansion risk variables.",
          "Market sizing is directional because no paid footfall, competitor POS, or lease database was uploaded."
        ],
        missingEvidence: [
          "Actual delivery platform commission export by product basket.",
          "Hourly payroll and kitchen prep roster export.",
          "Competitor menu price scrape for Wan Chai, Kwun Tong, Sha Tin, and Tsim Sha Tsui.",
          "Loyalty cohort data and customer acquisition cost by channel."
        ]
      },
      marketSizing: {
        tam: "Hong Kong premium casual Thai and non-Chinese dining demand across office workers, young professionals, mall diners, residents, and visitors.",
        sam: "Wan Chai plus reachable lunch, dinner, delivery, catering, and social media demand within the current operating model.",
        som: "A realistic second-store target is a disciplined share of weekday lunch and family/residential dinner demand in Kwun Tong or Sha Tin before testing a flagship-rent tourist district.",
        confidenceLevel: "Medium",
        methodNote:
          "TAM/SAM/SOM is directional and based on owner inputs, sample sales records, Hong Kong public restaurant demand context, and district fit assumptions rather than a paid market sizing dataset."
      },
      competitivePositioning: {
        directAlternatives: [
          "Premium Thai and Southeast Asian restaurants in Wan Chai, Causeway Bay, Central, and Tsim Sha Tsui.",
          "Mall casual dining brands competing for office lunch and weekend group occasions.",
          "Delivery-first Asian food brands using discounts to win convenience-driven orders."
        ],
        defensibility: [
          "Signature Thai mains and polished interior give the brand a stronger dinner and social-sharing angle than value-only competitors.",
          "Office lunch traffic provides recurring weekday demand if CRM and set pricing are improved.",
          "Catering and corporate lunch boxes can diversify revenue beyond table turns."
        ],
        watchouts: [
          "Premium districts can create brand visibility but weaken payback if rent exceeds the tested threshold.",
          "Delivery discounting can train customers away from full-price dine-in occasions.",
          "Operational inconsistency across stores would damage reviews faster than paid marketing can repair."
        ]
      },
      swotPlus: {
        strengths: [
          "Strong gross margin signal and high average ticket for a single-location restaurant.",
          "Clear lunch and dinner peaks that can support targeted pricing and staffing.",
          "Distinctive Thai menu and interior concept suitable for social content."
        ],
        weaknesses: [
          "Rent and payroll leave limited room for a failed second-store launch.",
          "Menu complexity and weekday overstock reduce prep efficiency.",
          "CRM ownership is weak relative to visible repeat customer opportunities."
        ],
        opportunities: [
          "Kwun Tong offers lower-rent office lunch demand for a second-store pilot.",
          "Sha Tin gives residential and family repeat demand with lower competitive pressure.",
          "Corporate lunch boxes can turn office clusters into predictable weekday volume.",
          "Seasonal Thai festival campaigns can create limited-time urgency without broad discounting."
        ],
        threats: [
          "High-rent districts can extend payback beyond a safe window.",
          "Ingredient and labor inflation can erode margin if prices are not reviewed monthly.",
          "Competitors can copy discounts faster than they can copy service consistency.",
          "Tourist-heavy districts are exposed to travel demand volatility."
        ],
        towsActions: [
          "Use signature dishes to anchor premium lunch sets and reduce dependence on discounting.",
          "Pair menu simplification with kitchen training before opening the second branch.",
          "Use CRM signup targets as a lease-readiness gate.",
          "Pilot Kwun Tong or Sha Tin first, then reserve premium districts for the third-store brand play."
        ]
      },
      porterFiveForces: {
        rivalry: {
          level: "High",
          note: "Hong Kong dining has dense competition, especially in premium and tourist districts."
        },
        buyerPower: {
          level: "Medium",
          note: "Customers have many alternatives, but the brand can reduce switching with signature dishes, service consistency, and loyalty capture."
        },
        supplierPower: {
          level: "Medium",
          note: "Specialty ingredients and packaging need supplier control, but menu simplification can reduce exposure."
        },
        substitutes: {
          level: "High",
          note: "Fast casual, delivery deals, mall dining, and other Asian cuisines compete for the same occasions."
        },
        newEntrants: {
          level: "Medium",
          note: "Opening a restaurant is feasible, but premium operations, reviews, staff training, and lease access create practical barriers."
        },
        overallAttractiveness:
          "Attractive for staged expansion if KITSUNE's rent, CRM, manager-readiness, and margin gates are met before lease signing."
      },
      businessModelReview: {
        revenueEngine: [
          "Premium lunch and dinner dine-in traffic.",
          "Takeaway and delivery for convenience occasions.",
          "Corporate lunch box and catering orders for predictable weekday volume.",
          "Seasonal Thai campaign items that increase visit frequency."
        ],
        costEngine: [
          "Rent, payroll, ingredients, utilities, delivery commission, packaging, and launch marketing.",
          "Waste from low-volume starters and desserts.",
          "Training and manager coverage cost for the second-store ramp."
        ],
        retentionEngine: [
          "Office-worker CRM capture for weekday lunch repeats.",
          "Weekend couple and group dining campaigns.",
          "Google Maps review loops and social content around signature dishes.",
          "Member-only Thai festival menus and pre-opening waitlist offers."
        ],
        scalabilityConstraints: [
          "Manager bench depth before second-store opening.",
          "Kitchen process consistency across branches.",
          "Lease payback discipline and rent-to-sales guardrail.",
          "Supplier reliability for signature ingredients."
        ]
      }
    },
    recommendations: {
      quickWins: [
        "Run a 14-day HK$188-HK$208 premium lunch set test on the top three signature mains.",
        "Remove or bundle the bottom 20% low-margin starters and desserts during weekdays.",
        "Launch an office-worker CRM signup offer tied to corporate lunch boxes."
      ],
      operationalImprovements: [
        "Create a peak-hour prep matrix for 12:00-14:00 and 19:00-21:00 service.",
        "Move one labor hour from the 15:00-17:30 trough into pre-dinner prep and delivery batching.",
        "Review ingredient waste by SKU weekly and set reorder thresholds for low-volume items."
      ],
      strategicMoves: [
        "Use Kwun Tong as the second-store pilot if the lease meets the target payback window.",
        "Require 1,000 CRM members and a trained branch manager before signing the second lease.",
        "Keep Causeway Bay and Tsim Sha Tsui as later flagship options after operational proof."
      ]
    },
    marketingStrategy: {
      positioning:
        "A polished modern Thai dining brand for office workers, young professionals, and weekend diners who want premium flavor without hotel-restaurant formality.",
      socialPosts: [
        "Lunch that works as hard as Wan Chai does: Green Curry Set, Thai Milk Tea, and a 45-minute service promise.",
        "From Bangkok heat to Hong Kong nights: Tom Yum Lobster Bowl returns this weekend with limited seats.",
        "Office team lunch? Pre-order corporate Thai boxes before 10:30 and skip the queue.",
        "Second branch shortlist is live: vote for Kwun Tong, Sha Tin, or TST and unlock a member tasting invite."
      ],
      campaigns: [
        "Wan Chai Office Lunch Sprint: 14-day set menu test with CRM signup tracking.",
        "Thai Festival Weekend: limited-time menu, UGC wall, and dinner reservation bundle.",
        "Second Store Waitlist: district voting, tasting event, and member-only opening offer.",
        "Corporate Box Wednesday: targeted outreach to offices within delivery radius."
      ],
      loyaltyProgram:
        "KITSUNE recommends a tiered loyalty system: lunch stamps for office workers, dinner tasting invites for high-value guests, and pre-opening benefits for second-store waitlist members.",
      seasonalCalendar: [
        "July: Summer Thai Tea Week with beverage bundles.",
        "August: Office Lunch Sprint and corporate box trial.",
        "September: Mid-Autumn group dining menu.",
        "October: Second-store district tasting event.",
        "November: Loy Krathong-inspired dinner campaign.",
        "December: Corporate party and catering push."
      ]
    },
    financialImpactSimulation: {
      expectedRevenueIncrease: 0.14,
      expectedCostReduction: 0.065,
      expectedProfitIncrease: 0.19,
      roiEstimation:
        "KITSUNE estimates a 9-13 month payback window for a disciplined Kwun Tong-style pilot if rent is controlled and CRM conversion improves before opening."
    },
    actionPlanRoadmap: {
      now: [
        "Run lunch price architecture test on top signature sets.",
        "Freeze second-store lease decisions until CRM and manager gates are tracked.",
        "Tag low-margin weekday SKUs for bundle, repricing, or removal."
      ],
      next30Days: [
        "Build CRM capture flow for office lunch and weekend dinner segments.",
        "Create branch manager training checklist and peak-hour prep matrix.",
        "Collect competitor menu prices and Google Maps review themes for shortlisted districts."
      ],
      next3Months: [
        "Negotiate Kwun Tong and Sha Tin lease options with payback caps.",
        "Launch second-store waitlist and district voting campaign.",
        "Run supplier and delivery commission review by product family."
      ],
      next12Months: [
        "Open second-store pilot only after readiness gates are met.",
        "Monitor payback, repeat rate, review score, and staff utilization weekly.",
        "Convert the operating playbook into a repeatable branch launch system."
      ]
    },
    visibleAnalysisLog: [
      "Validated Hong Kong currency, Wan Chai location, single-store operating model, selected expansion goals, and uploaded evidence types.",
      "Reconciled 84 days of transaction rows with owner-entered monthly revenue, rent, labor, ingredient, utilities, net profit, and AOV assumptions.",
      "Separated lunch, dinner, delivery, catering, weekday, weekend, and off-peak demand to identify capacity and margin constraints.",
      "Compared district options using rent pressure, footfall, competition, target fit, transit, and payback risk.",
      "Applied strategy frameworks: TAM/SAM/SOM, competitor alternatives, SWOT+, Porter five forces, business model review, and evidence confidence.",
      "Selected one top priority per section using expected profit uplift, revenue lift, cost reduction, and lease-risk control.",
      "Validated the report structure for KPI cards, charts, strategic validation, priority highlights, marketing plan, design brief, and export readiness."
    ],
    priorityHighlights: {
      keyInsights: {
        item: "Repeat-customer capture is the largest marketing gap because office and weekend segments are visible but not fully owned in CRM.",
        reason: "CRM ownership improves launch confidence and reduces second-store marketing risk."
      },
      problemDiagnosis: {
        item: "The store has demand, but profit buffer is compressed by rent, payroll, and low-volume SKUs.",
        reason: "This issue affects both current profit and second-store payback."
      },
      bottleneckAnalysis: {
        item: "Manager bandwidth is the operational bottleneck for a second store because the flagship still depends on senior staff during peak service.",
        reason: "Expansion fails fastest when management capacity is not transferable."
      },
      profitLeakageBenchmarking: {
        item: "Rent plus labor consumes more than half of monthly revenue, so every second-store lease needs a strict payback gate.",
        reason: "Fixed-cost discipline has the largest downside protection before signing a lease."
      },
      scenarioSimulation: {
        item: "A +8% lunch set price test on high-demand items can lift monthly revenue without adding seats or kitchen capacity.",
        reason: "It creates the fastest revenue lift with minimal operating complexity."
      },
      quickWins: {
        item: "Run a 14-day HK$188-HK$208 premium lunch set test on the top three signature mains.",
        reason: "A controlled price test can improve margin quickly without capex."
      },
      operationalImprovements: {
        item: "Create a peak-hour prep matrix for 12:00-14:00 and 19:00-21:00 service.",
        reason: "Peak execution protects revenue, reviews, and manager transferability."
      },
      strategicMoves: {
        item: "Use Kwun Tong as the second-store pilot if the lease meets the target payback window.",
        reason: "Lower rent improves the probability of a profitable second-store test."
      },
      marketingCampaigns: {
        item: "Second Store Waitlist: district voting, tasting event, and member-only opening offer.",
        reason: "It validates demand before lease commitment and builds launch traffic."
      },
      socialPosts: {
        item: "Second branch shortlist is live: vote for Kwun Tong, Sha Tin, or TST and unlock a member tasting invite.",
        reason: "It converts social engagement into measurable expansion demand."
      },
      roadmapNow: {
        item: "Freeze second-store lease decisions until CRM and manager gates are tracked.",
        reason: "This prevents premature fixed-cost commitment."
      },
      roadmapNext30Days: {
        item: "Collect competitor menu prices and Google Maps review themes for shortlisted districts.",
        reason: "Competitor evidence improves pricing and district fit confidence."
      },
      roadmapNext3Months: {
        item: "Negotiate Kwun Tong and Sha Tin lease options with payback caps.",
        reason: "Lease economics are the largest expansion-risk lever."
      },
      roadmapNext12Months: {
        item: "Convert the operating playbook into a repeatable branch launch system.",
        reason: "A playbook turns one successful pilot into scalable chain operations."
      }
    }
  };
}

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
        notes: "84 days of transaction-level sample sales records by date, hour, product, category, channel, revenue, units, and cost."
      },
      {
        kind: "inventory",
        name: "kitsune-sample-inventory-summary.xlsx",
        notes: "Weekday starter and dessert overstock, Thai tea packaging use, and low-volume SKU waste signals."
      },
      {
        kind: "marketing",
        name: "kitsune-sample-marketing-notes.pdf",
        notes: "Instagram, TikTok, Google Maps, office lunch, corporate box, second-store waitlist, and seasonal campaign context."
      },
      {
        kind: "cost",
        name: "kitsune-sample-cost-structure.xlsx",
        notes: "Rent, labor, ingredient, utilities, packaging, delivery commission, and opening cost assumptions for expansion analysis."
      },
      {
        kind: "other",
        name: "hk-restaurant-market-context-2025.pdf",
        notes: "Directional public context: Hong Kong restaurant receipt recovery, non-Chinese restaurant growth, and visitor demand support."
      },
      {
        kind: "other",
        name: "second-store-district-shortlist.xlsx",
        notes: "Curated demo shortlist for Kwun Tong, Sha Tin, Tsim Sha Tsui, Causeway Bay, Central, and Tseung Kwan O."
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
  const report = enrichPresetReport(generateSimulatedReport(presetPayload));
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
